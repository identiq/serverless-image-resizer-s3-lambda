/**
 * API utility functions for the image resizer application
 */

/**
 * Get a pre-signed URL for file upload
 * @param functionUrlPresign - The Lambda function URL for presigning
 * @param fileName - The name of the file to upload
 * @returns The pre-signed URL data
 */
export async function getPresignUrl(functionUrlPresign: string, fileName: string) {
  try {
    const response = await fetch(`${functionUrlPresign}/${fileName}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error(`Failed to get pre-signed URL: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting pre-signed URL:", error);
    throw error;
  }
}

/**
 * Upload a file to S3 using a pre-signed URL
 * @param url - The S3 URL to upload to
 * @param fields - The form fields required for the upload
 * @param file - The file to upload
 * @returns The response from the upload
 */
export async function uploadToS3(url: string, fields: Record<string, string>, file: File) {
  const formData = new FormData();
  
  // Add form fields
  Object.entries(fields).forEach(([field, value]) => {
    formData.append(field, value);
  });
  
  // Add file (must be last)
  formData.append('file', file);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    return response;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

/**
 * Get the list of images from the Lambda function
 * @param functionUrlList - The Lambda function URL for listing images
 * @returns The list of images
 */
export async function listImages(functionUrlList: string) {
  try {
    const response = await fetch(functionUrlList, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error(`Failed to list images: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error listing images:", error);
    throw error;
  }
}
