import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfigState {
  functionUrlPresign: string;
  functionUrlList: string;
  setFunctionUrlPresign: (url: string) => void;
  setFunctionUrlList: (url: string) => void;
  clearConfig: () => void;
  loadFromApi: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      functionUrlPresign: '',
      functionUrlList: '',
      setFunctionUrlPresign: (url) => set({ functionUrlPresign: url }),
      setFunctionUrlList: (url) => set({ functionUrlList: url }),
      clearConfig: () => set({ functionUrlPresign: '', functionUrlList: '' }),
      loadFromApi: async () => {
        try {
          // Use the specific LocalStack URL provided
          const baseUrl = "https://localhost.localstack.cloud:4566";
          
          const headers = {
            authorization: "AWS4-HMAC-SHA256 Credential=test/20231004/us-east-1/lambda/aws4_request, ..."
          };

          // Load presign URL
          const loadPresignUrl = async () => {
            try {
              const url = `${baseUrl}/2021-10-31/functions/presign/urls`;
              // Use fetch with mode: 'no-cors' to avoid CORS issues with LocalStack
              const response = await fetch(url, { 
                headers,
                method: 'GET'
              });
              if (!response.ok) {
                throw new Error(`Failed to fetch presign URL: ${response.status}`);
              }
              const data = await response.json();
              return data.FunctionUrlConfigs[0].FunctionUrl.replace('http://', 'https://');
            } catch (error) {
              console.error("Error fetching presign URL:", error);
              // Return a fallback URL for development
              return "https://localhost.localstack.cloud:4566/lambda/presign";
            }
          };

          // Load list URL
          const loadListUrl = async () => {
            try {
              const url = `${baseUrl}/2021-10-31/functions/list/urls`;
              const response = await fetch(url, { 
                headers,
                method: 'GET'
              });
              if (!response.ok) {
                throw new Error(`Failed to fetch list URL: ${response.status}`);
              }
              const data = await response.json();
              return data.FunctionUrlConfigs[0].FunctionUrl.replace('http://', 'https://');
            } catch (error) {
              console.error("Error fetching list URL:", error);
              // Return a fallback URL for development
              return "https://localhost.localstack.cloud:4566/lambda/list";
            }
          };

          // Execute both in parallel
          const [presignUrl, listUrl] = await Promise.all([
            loadPresignUrl(),
            loadListUrl()
          ]);
          
          set({
            functionUrlPresign: presignUrl,
            functionUrlList: listUrl
          });
        } catch (error) {
          console.error("Failed to load API URLs:", error);
          throw error;
        }
      }
    }),
    {
      name: 'lambda-config-storage',
    }
  )
);
