import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useConfigStore } from '../store/configStore';
import { getPresignUrl, uploadToS3 } from '../utils/api';

/**
 * Upload component for handling file uploads to S3 via Lambda pre-signed URLs
 */
export function Upload() {
  const { functionUrlPresign } = useConfigStore();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!functionUrlPresign) {
      setMessage({
        text: 'Please set the function URL of the presign Lambda',
        type: 'error'
      });
      return;
    }
    
    if (!file) {
      setMessage({
        text: 'Please select a file to upload',
        type: 'error'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setMessage(null);
      
      const fileName = file.name;
      
      // Get pre-signed URL from Lambda function
      const presignData = await getPresignUrl(functionUrlPresign, fileName);
      
      // Upload file to S3 using pre-signed URL
      await uploadToS3(presignData.url, presignData.fields, file);
      
      setMessage({
        text: 'File uploaded successfully!',
        type: 'success'
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      
      // Emit an event to notify other components (like ImageList) that a new upload was successful
      window.dispatchEvent(new CustomEvent('image-uploaded'));
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({
        text: 'Error uploading file. Check the console for details.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="my-4">
      <div className="flex items-center mb-3">
        <h1 className="text-xl font-semibold">Upload your file</h1>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <hr className="mb-4 border-gray-200" />
      
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <span className="font-medium">Input</span>
        </div>
        
        <div className="p-4 bg-white">
          <h5 className="text-lg font-medium mb-2">Form</h5>
          <p className="text-gray-600 text-sm mb-4">
            This form calls the <code className="bg-gray-100 px-1 py-0.5 rounded">presign</code> Lambda to request an S3 pre-signed POST URL,
            and then forwards the POST request directly to S3.
            Resizing the image to max 400x400 pixels happens asynchronously through S3 bucket notifications.
            If the resizing of an image fails, then an SNS message will be sent, which will trigger an SES email
            notification.
          </p>
          
          {message && (
            <div className={`p-3 mb-4 rounded text-sm ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
          
          <form id="uploadForm" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="customFile">
                Select your file to upload
              </label>
              <input
                ref={fileInputRef}
                type="file"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                id="customFile"
                name="file"
                required
                onChange={handleFileChange}
              />
            </div>
            
            <button
              type="submit"
              className={`inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading || !file}
            >
              {isLoading ? 'Uploading...' : 'Upload'}
              {!isLoading && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
