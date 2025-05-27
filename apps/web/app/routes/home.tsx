import type { Route } from "./+types/home";
import { Configuration } from "../components/Configuration";
import { Upload } from "../components/Upload";
import { ImageList } from "../components/ImageList";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Serverless image resizer" },
    { name: "description", content: "Serverless thumbnail generator using Lambda and S3" },
    { 
      name: "Content-Security-Policy", 
      content: "upgrade-insecure-requests"
    },
  ];
}

export default function Home() {
  return (
    <div className="col-lg-8 mx-auto p-4 py-md-5">
      <header className="flex items-center pb-3 mb-5 border-b">
        <a href="/" className="flex items-center text-gray-800 dark:text-white no-underline">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <span className="text-xl font-medium">Serverless thumbnail generator</span>
        </a>
      </header>

      <main>
        <Configuration />
        <Upload />
        <ImageList />
      </main>

      <footer className="pt-5 my-5 text-gray-500 border-t">
        Created by the LocalStack team - &copy; 2023
      </footer>
    </div>
  );
}
