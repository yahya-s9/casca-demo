# Casca Demo - Document Analysis for Underwriting

tool helps underwriters quickly analyze financial documents of SBA loan applicants, and then allows them to evaluate it

## Features

- Multi-Document upload on front-end -> OCR with tesseract -> text -> chroma's default embedding -> stored in chroma vector DB to support RAG
- (skipped text chunking and custom embedding for demo purposes)
- the undderwriter can then ask questions ab the uploaded documents in natural lang

## Back-End REST Routes

- /upload: accepts the uploaded images. Uses Tesseract OCR to extract text from each image.
- /ask: Accepts a question + list of document IDs. Fetches from ChromaDB, prompts claude, relays response
- /generate-evaluation: Pulls all documents and asks Claude to generate a full underwriting evaluation report

## Tech Stack

- Frontend: Next.js / TypeScript
- Backend: Python / FastAPI
- OCR: Tesseract
- Vector Store: ChromaDB
- LLM: Claude API
- Document Processing: PyPDF2, pdf2image

### Installation

1. Clone the repository
2. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

4. Create a `.env` file in the backend directory with your API keys:
   ```
   CLAUDE_API_KEY=your_key_here
   ```

### Running the Application

1. Start the backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Development

- Backend API documentation available at `/docs` when running the server
- Frontend development server runs on `http://localhost:3000`
- Backend API runs on `http://localhost:8000`
