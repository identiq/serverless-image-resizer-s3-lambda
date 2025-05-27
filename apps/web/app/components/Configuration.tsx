import { useState } from 'react';
import type { FormEvent } from 'react';
import { useConfigStore } from '../store/configStore';

/**
 * Configuration component for managing Lambda function URLs
 */
export function Configuration() {
  const {
    functionUrlPresign,
    functionUrlList,
    setFunctionUrlPresign,
    setFunctionUrlList,
    clearConfig,
    loadFromApi
  } = useConfigStore();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Get the button that was clicked
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    const action = submitter?.name;
    
    try {
      setIsLoading(true);
      setMessage(null);
      
      if (action === 'load') {
        await loadFromApi();
        setMessage({ text: 'Function URL configurations loaded', type: 'success' });
      } else if (action === 'save') {
        // This is handled by Zustand's persist middleware already
        setMessage({ text: 'Configuration saved', type: 'success' });
      } else if (action === 'clear') {
        clearConfig();
        setMessage({ text: 'Configuration cleared', type: 'success' });
      } else {
        setMessage({ text: 'Unknown action', type: 'error' });
      }
    } catch (error) {
      console.error('Error in configuration action:', error);
      setMessage({ text: 'An error occurred. Check the console.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="my-4">
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Configuration</span>
        </div>
        <div className="p-4 bg-white">
          <h5 className="text-lg font-medium mb-4">
            Set the Lambda Function URLs here
          </h5>
          
          {message && (
            <div className={`p-3 mb-4 rounded text-sm ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
          
          <form id="configForm" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1" htmlFor="functionUrlPresign">
                Function URL of the <code className="bg-gray-100 px-1 py-0.5 rounded">presign</code> Lambda
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="functionUrlPresign"
                value={functionUrlPresign}
                onChange={(e) => setFunctionUrlPresign(e.target.value)}
                autoComplete="off"
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1" htmlFor="functionUrlList">
                Function URL of the <code className="bg-gray-100 px-1 py-0.5 rounded">list</code> Lambda
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="functionUrlList"
                value={functionUrlList}
                onChange={(e) => setFunctionUrlList(e.target.value)}
                autoComplete="off"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="submit"
                name="load"
                className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                Load from API
              </button>
              
              <button
                type="submit"
                name="save"
                className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                Apply
              </button>
              
              <button
                type="submit"
                name="clear"
                className={`px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
