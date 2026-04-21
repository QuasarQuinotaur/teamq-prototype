// Shared pdf.js worker for react-pdf (card thumbnails; full-screen viewer uses @iamjariwala/react-doc-viewer).
import { pdfjs } from "react-pdf";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export { pdfjs };
