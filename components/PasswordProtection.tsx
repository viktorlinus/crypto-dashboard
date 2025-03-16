'use client';

import { useState, ReactNode } from 'react';

interface PasswordProtectionProps {
  children: ReactNode;
  correctPassword: string;
}

export default function PasswordProtection({ children, correctPassword }: PasswordProtectionProps) {
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === correctPassword) {
      setIsLoading(true);
      // Add a small delay to show the loading state
      setTimeout(() => {
        setAuthorized(true);
        setError('');
      }, 500);
    } else {
      setAttempts(attempts + 1);
      setError(`Incorrect password. ${attempts >= 2 ? 'Please contact the administrator for assistance.' : 'Please try again.'}`);
      setPassword('');
    }
  };
  
  if (authorized) {
    return <>{children}</>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto my-10">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Protected Content</h2>
        <p className="text-gray-600">
          This indicator requires authorization. Please enter the password to continue.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter password"
            required
            disabled={isLoading}
          />
        </div>
        
        {error && (
          <div className="text-red-600 text-sm py-1">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLoading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading Indicator...
            </div>
          ) : (
            'Unlock'
          )}
        </button>
      </form>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        <p>
          For access, please contact the administrator or refer to your documentation.
        </p>
      </div>
      
      <div className="mt-6 pt-4 border-t text-xs text-gray-500">
        <p>
          Note: This indicator's data is only loaded after successful authentication. No API calls
          are made until the correct password is provided.
        </p>
      </div>
    </div>
  );
}