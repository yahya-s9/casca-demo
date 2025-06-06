'use client';

import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Evaluation() {
  const [evaluation, setEvaluation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    generateEvaluation();
  }, []);

  const generateEvaluation = async () => {
    try {
      const response = await fetch('http://localhost:8000/generate-evaluation', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to generate evaluation');

      const data = await response.json();
      setEvaluation(data.evaluation);
    } catch (error) {
      console.error('Error generating evaluation:', error);
      alert('Failed to generate evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([evaluation], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'loan-evaluation.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Documents
            </Link>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Loan Application Evaluation</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Review and edit the evaluation report. All changes are automatically saved.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download Report
              </button>
            </div>
          </div>

          {/* Evaluation Form */}
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generating evaluation report...</p>
              </div>
            ) : (
              <textarea
                value={evaluation}
                onChange={(e) => setEvaluation(e.target.value)}
                className="w-full h-[calc(100vh-300px)] p-6 text-gray-900 focus:ring-0 focus:border-0 border-0"
                placeholder="Evaluation report will be generated here..."
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 