# Casca Demo - Document Analysis for Underwriting

A modern document analysis tool that helps underwriters quickly extract and analyze information from business documents using AI.

## Features

- Document upload and OCR processing
- AI-powered document analysis and question answering
- Vector-based semantic search
- Interactive document viewer
- Natural language query interface

## Tech Stack

- Frontend: Next.js 14 with TypeScript
- Backend: Python FastAPI
- OCR: Tesseract
- Vector Store: Chroma
- LLM: Claude API
- Document Processing: PyPDF2, pdf2image

## Project Structure

```
casca-demo/
├── frontend/           # Next.js frontend application
├── backend/           # FastAPI backend service
│   ├── app/          # Application code
│   ├── tests/        # Test suite
│   └── requirements.txt
└── docs/             # Documentation
```

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Tesseract OCR
- Claude API key

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

## License

MIT