/**
 * Interface for image data returned from the list Lambda
 */
export interface ImageItemData {
  Name: string;
  Timestamp: string;
  Original: {
    URL: string;
    Size: number;
  };
  Resized?: {
    URL: string;
    Size: number;
  };
}

/**
 * Component to display an individual image item with details
 */
export function ImageItem({ image }: { image: ImageItemData }) {
  return (
    <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <span className="font-medium">{image.Name}</span>
      </div>
      
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 p-4">
          {image.Resized ? (
            <img 
              src={image.Resized.URL} 
              alt={image.Name}
              className="max-w-full h-auto rounded"
            />
          ) : (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
        
        <div className="md:w-2/3 p-4">
          <div className="mb-2">
            <h3 className="font-bold">{image.Name}</h3>
          </div>
          
          <div className="mb-2">
            <p className="text-gray-700 text-sm">Timestamp: {image.Timestamp}</p>
          </div>
          
          <div className="mb-2">
            <p className="text-gray-700 text-sm">
              <a 
                href={image.Original.URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Original
              </a> 
              <span className="text-gray-500 ml-1">
                ({image.Original.Size} bytes)
              </span>
            </p>
          </div>
          
          <div>
            {image.Resized ? (
              <p className="text-gray-700 text-sm">
                <a 
                  href={image.Resized.URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Resized
                </a> 
                <span className="text-gray-500 ml-1">
                  ({image.Resized.Size} bytes)
                </span>
              </p>
            ) : (
              <p className="text-gray-700 text-sm">
                <span className="text-gray-500">Resizing in progress...</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
