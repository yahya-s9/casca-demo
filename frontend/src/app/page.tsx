'use client';

import { useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { DocumentIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface Document {
  id: string;
  metadata: {
    filename: string;
    content_type: string;
  };
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        alert('Invalid file type. Please upload PDF, PNG, or JPG files.');
        return;
      }

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', acceptedFiles[0]);

        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        setDocuments(prev => [...prev, { id: data.id, metadata: { filename: acceptedFiles[0].name, content_type: acceptedFiles[0].type } }]);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload document');
      } finally {
        setLoading(false);
      }
    }
  });

  const handleAskQuestion = async () => {
    if (!selectedDocument || !question.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: selectedDocument,
          text: question,
        }),
      });

      if (!response.ok) throw new Error('Failed to get answer');

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Question error:', error);
      alert('Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Document Analysis Dashboard</h1>
          
          {/* Document Upload Section */}
          <div className="mb-8">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <input {...getInputProps()} />
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive
                  ? 'Drop the document here'
                  : 'Drag and drop a document here, or click to select'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports PDF, PNG, JPG
              </p>
            </div>
          </div>

          {/* Documents List */}
          {documents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Processed Documents</h2>
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors
                      ${selectedDocument === doc.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => setSelectedDocument(doc.id)}
                  >
                    <p className="font-medium text-gray-900">{doc.metadata.filename}</p>
                    <p className="text-sm text-gray-500">{doc.metadata.content_type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question Section */}
          {selectedDocument && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ask Questions</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about the document..."
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={loading || !question.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                  Ask
                </button>
              </div>
            </div>
          )}

          {/* Answer Section */}
          {answer && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Answer</h2>
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-700 whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Processing...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
