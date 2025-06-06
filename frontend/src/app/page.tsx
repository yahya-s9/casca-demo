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
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [processingQuestion, setProcessingQuestion] = useState(false);

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

      setUploadingFiles(acceptedFiles.map(f => f.name));
      try {
        // Process all files in parallel
        const uploadPromises = acceptedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('http://localhost:8000/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error(`Upload failed for ${file.name}`);

          const data = await response.json();
          return { id: data.id, metadata: { filename: file.name, content_type: file.type } };
        });

        const results = await Promise.all(uploadPromises);
        setDocuments(prev => [...prev, ...results]);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload one or more documents');
      } finally {
        setUploadingFiles([]);
      }
    }
  });

  const handleAskQuestion = async () => {
    if (selectedDocuments.length === 0 || !question.trim()) return;

    setProcessingQuestion(true);
    try {
      console.log('Selected documents:', documents.filter(doc => selectedDocuments.includes(doc.id)));
      console.log('Sending question with document IDs:', selectedDocuments);
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_ids: selectedDocuments,
          text: question,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          selectedDocuments,
          allDocuments: documents
        });
        throw new Error(`Failed to get answer: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received answer:', data);
      setAnswer(data.answer);
    } catch (error) {
      console.error('Question error:', error);
      alert(error instanceof Error ? error.message : 'Failed to get answer');
    } finally {
      setProcessingQuestion(false);
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">SBA Loan Underwriter Assistant</h1>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <p className="text-gray-700">
              Welcome to the SBA Loan Underwriting Assistant. Upload one or multiple documents (tax returns, financial statements, business plans, etc.) and ask natural language questions about them. Claude will analyze all selected documents together to provide comprehensive answers for your underwriting process.
            </p>
          </div>
          
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
                  ? 'Drop the documents here'
                  : 'Drag and drop documents here, or click to select'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports PDF, PNG, JPG
              </p>
            </div>
            {uploadingFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Uploading files:</p>
                <ul className="space-y-1">
                  {uploadingFiles.map((filename, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                      {filename}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Documents List */}
          {documents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
              <p className="text-sm text-gray-600 mb-4">Select one or more documents to analyze together</p>
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors
                      ${selectedDocuments.includes(doc.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => toggleDocumentSelection(doc.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => {}}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{doc.metadata.filename}</p>
                        <p className="text-sm text-gray-500">{doc.metadata.content_type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedDocuments.length > 0 
                ? `Ask Questions (${selectedDocuments.length} document${selectedDocuments.length > 1 ? 's' : ''} selected)`
                : 'Ask Questions'}
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={selectedDocuments.length > 0 
                  ? "Ask a question about the selected documents..."
                  : "Upload and select one or more documents to start asking questions"}
                disabled={selectedDocuments.length === 0 || processingQuestion}
                className={`flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500
                  ${(selectedDocuments.length === 0 || processingQuestion) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <button
                onClick={handleAskQuestion}
                disabled={processingQuestion || !question.trim() || selectedDocuments.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {processingQuestion ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                    Ask
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Answer Section */}
          {answer && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Answer</h2>
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-700 whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
