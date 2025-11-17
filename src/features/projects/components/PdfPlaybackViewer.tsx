import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

interface PdfPlaybackViewerProps {
  pdfUrl: string;
  audioUrl: string;
  highlightedLineIndex?: number;
  onBack?: () => void;
}

export function PdfPlaybackViewer({
  pdfUrl,
  audioUrl,
  highlightedLineIndex,
  onBack,
}: PdfPlaybackViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load PDF document
  useEffect(() => {
    let isMounted = true;
    
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        if (isMounted) {
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load PDF:", err);
        if (isMounted) {
          setError("Failed to load PDF document");
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;

        // Set scale for high-DPI displays
        const scale = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: 1.5 });

        // Set canvas dimensions
        canvas.width = viewport.width * scale;
        canvas.height = viewport.height * scale;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Scale context for high-DPI
        context.scale(scale, scale);

        // Render PDF page
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

      } catch (err) {
        console.error("Failed to render page:", err);
        setError("Failed to render PDF page");
      }
    };

    renderPage();
  }, [pdfDoc, currentPage]);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
        <div className="text-white text-lg">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0f0f0f] gap-4">
        <div className="text-red-400 text-lg">{error}</div>
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f]">
      {/* Header with controls */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-800">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            data-testid="button-back"
          >
            ← Back
          </Button>
        )}

        {/* Page navigation */}
        <div className="flex items-center gap-3">
          <Button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            variant="outline"
            size="icon"
            data-testid="button-prev-page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-white text-sm min-w-[100px] text-center">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            variant="outline"
            size="icon"
            data-testid="button-next-page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-20" /> {/* Spacer for layout balance */}
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-8">
        <canvas
          ref={canvasRef}
          className="shadow-2xl"
          data-testid="pdf-canvas"
        />
      </div>

      {/* Audio Player */}
      <div className="p-4 border-t border-gray-800">
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          className="w-full"
          data-testid="audio-player"
        />
      </div>
    </div>
  );
}
