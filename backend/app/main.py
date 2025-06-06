from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import io
import chromadb
from anthropic import Anthropic
import json
import tempfile

# Load environment variables
load_dotenv()
api_key = os.getenv("CLAUDE_API_KEY")
if not api_key:
    print("[ERROR] CLAUDE_API_KEY not found in environment variables")
    raise ValueError("CLAUDE_API_KEY environment variable is required")
elif not api_key.startswith("sk-"):
    print("[ERROR] Invalid CLAUDE_API_KEY format - should start with 'sk-'")
    raise ValueError("Invalid CLAUDE_API_KEY format")
else:
    print(f"[INFO] Claude API key loaded successfully (starts with: {api_key[:7]}...)")

app = FastAPI(title="SBA Loan Underwriting Assistant")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChromaDB
print("[STARTUP] Initializing ChromaDB...")
chroma_client = chromadb.PersistentClient(path="./chroma_db")
try:
    collection = chroma_client.get_collection(name="documents")
    print(f"[STARTUP] Retrieved existing collection 'documents'")
    # Print collection stats
    collection_count = collection.count()
    print(f"[STARTUP] Collection contains {collection_count} documents")
except ValueError:
    print("[STARTUP] Creating new collection 'documents'")
    collection = chroma_client.create_collection(name="documents")
    print("[STARTUP] New collection created")

# Initialize Anthropic client
anthropic = Anthropic(api_key=api_key)

class Question(BaseModel):
    text: str
    document_ids: List[str]

class DocumentResponse(BaseModel):
    id: str
    text: str
    metadata: dict

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and process a document using OCR
    """
    try:
        # Read file content
        content = await file.read()
        
        # Convert PDF to images if necessary
        if file.content_type == "application/pdf":
            # Save the PDF content to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                temp_file.write(content)
                temp_file_path = temp_file.name
            
            images = convert_from_path(temp_file_path)
            text = ""
            for image in images:
                text += pytesseract.image_to_string(image)
            
            # Clean up the temporary file
            os.unlink(temp_file_path)
        else:
            # Process as image
            image = Image.open(io.BytesIO(content))
            text = pytesseract.image_to_string(image)

        # Store in ChromaDB
        doc_id = str(hash(text))  # Simple hash as ID
        collection.add(
            documents=[text],
            metadatas=[{"filename": file.filename, "content_type": file.content_type}],
            ids=[doc_id]
        )

        return {"id": doc_id, "text": text}

    except Exception as e:
        print(f"[UPLOAD ERROR] {e}")  # Log the error to the terminal
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(question: Question):
    """
    Ask a question about multiple documents
    """
    try:
        print(f"[ASK] Received question: {question.text} for documents: {question.document_ids}")
        
        # Retrieve all documents from ChromaDB
        try:
            results = collection.get(ids=question.document_ids)
            print(f"[ASK] ChromaDB results: {results}")
        except Exception as chroma_error:
            print(f"[ASK ERROR] ChromaDB error: {str(chroma_error)}")
            raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(chroma_error)}")

        if not results["documents"]:
            print(f"[ASK] No documents found for IDs: {question.document_ids}")
            raise HTTPException(status_code=404, detail="Documents not found")
        
        # Combine all document texts
        all_documents = []
        for doc_text, metadata in zip(results["documents"], results["metadatas"]):
            all_documents.append(f"Document: {metadata['filename']}\n{doc_text}\n")
        
        combined_text = "\n---\n".join(all_documents)
        print(f"[ASK] Retrieved {len(all_documents)} documents")
        print(f"[ASK] Combined text length: {len(combined_text)}")
        
        # Prepare prompt for Claude
        prompt = f"""You are an expert SBA loan underwriter assistant. Please analyze the following documents together and answer the question.
        
Documents:
{combined_text}

Question: {question.text}

Please provide a comprehensive answer based on all the information present in the documents. Consider how the documents relate to each other and provide insights that combine information from multiple documents when relevant. If certain information is not available, say so."""

        print("[ASK] Sending request to Claude...")
        try:
            # Get response from Claude
            response = anthropic.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            print("[ASK] Received response from Claude")
        except Exception as api_error:
            print(f"[ASK ERROR] Claude API error: {str(api_error)}")
            print(f"[ASK ERROR] API Key (first 4 chars): {api_key[:4] if api_key else 'None'}")
            raise HTTPException(status_code=500, detail=f"Error calling Claude API: {str(api_error)}")

        return {"answer": response.content[0].text}

    except HTTPException as he:
        print(f"[ASK ERROR] HTTP Exception: {str(he)}")
        raise he
    except Exception as e:
        print(f"[ASK ERROR] Unexpected error: {str(e)}")
        print(f"[ASK ERROR] Error type: {type(e)}")
        import traceback
        print(f"[ASK ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
async def list_documents():
    """
    List all processed documents
    """
    try:
        result = collection.get()
        return {
            "documents": [
                {"id": id, "metadata": metadata}
                for id, metadata in zip(result["ids"], result["metadatas"])
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-claude")
async def test_claude():
    """
    Test endpoint to verify Claude API key
    """
    try:
        print(f"[TEST] API Key (first 4 chars): {api_key[:4] if api_key else 'None'}")
        response = anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=100,
            messages=[{"role": "user", "content": "Hello, this is a test message."}]
        )
        return {"status": "success", "message": "Claude API is working!"}
    except Exception as e:
        print(f"[TEST ERROR] {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 