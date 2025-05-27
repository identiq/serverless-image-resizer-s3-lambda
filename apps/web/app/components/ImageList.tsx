import { useState, useEffect } from 'react';
import { useConfigStore } from '../store/configStore';
import { listImages } from '../utils/api';
import { ImageItem, type ImageItemData } from './ImageItem';

/**
 * Component to display a list of images fetched from the list Lambda
 */
export function ImageList() {
  const { functionUrlList } = useConfigStore();
  const [images, setImages] = useState<ImageItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch the list of images from the list Lambda
   */
  const fetchImages = async () => {
    if (!functionUrlList) {
      setError('Please set the function URL of the list Lambda');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await listImages(functionUrlList);
      setImages(data);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to fetch images. Check the console for details.');
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch images on component mount and when functionUrlList changes
  useEffect(() => {
    if (functionUrlList) {
      fetchImages();
    }
  }, [functionUrlList]);

  // Listen for image uploaded event to refresh the list
  useEffect(() => {
    const handleImageUploaded = () => {
      fetchImages();
    };

    window.addEventListener('image-uploaded', handleImageUploaded);
    
    return () => {
      window.removeEventListener('image-uploaded', handleImageUploaded);
    };
  }, [functionUrlList]);

  return (
    <section className="my-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">List your files</h1>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 012-2h8a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V3zm2 0v14h8V3H6zm4 1a1 1 0 100 2 1 1 0 000-2zm0 8a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        </div>
        
        <button
          onClick={fetchImages}
          className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading}
          id="updateImageListButton"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
          {!isLoading && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">
        The images you uploaded should be shown here.
        When the refresh action is triggered, a request is made to the <code className="bg-gray-100 px-1 py-0.5 rounded">list</code> Lambda URL
        which returns a JSON document of all items in the images and the resized images bucket.
      </p>
      
      <hr className="mb-4 border-gray-200" />
      
      {error && (
        <div className="p-4 mb-4 rounded bg-red-100 text-red-800">
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading images...</p>
        </div>
      )}
      
      {!isLoading && images.length === 0 && !error && (
        <div className="text-center p-8 border border-dashed border-gray-300 rounded">
          <p className="text-gray-500">No images found. Upload some images to see them here.</p>
        </div>
      )}
      
      <div id="imagesContainer">
        {images.map((image) => (
          <ImageItem key={`${image.Name}-${image.Timestamp}`} image={image} />
        ))}
      </div>
    </section>
  );
}
