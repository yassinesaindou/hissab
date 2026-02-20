'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  }) {
  
  const [isOffline, setIsOffline] = useState(false);

useEffect(() => {
  setIsOffline(!navigator.onLine);
}, []);
  
  
  useEffect(() => {
    console.error(error);
  }, [error]);

   

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <AlertTriangle className="h-16 w-16 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            {isOffline ? 'You are offline' : 'Something went wrong!'}
          </h1>
          
          <p className="text-gray-600">
            {isOffline
              ? 'Please check your internet connection and try again.'
              : 'An unexpected error has occurred. Please try again.'}
          </p>
        </div>
        
        <div className="space-y-3 pt-4">
          {isOffline ? (
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry when online
            </button>
          ) : (
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          )}
          
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            Go back home
          </Link>
        </div>
        
        {isOffline && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">What you can do offline:</h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Create new transactions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                View previously loaded products
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Process sales
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Manage customers locally
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}