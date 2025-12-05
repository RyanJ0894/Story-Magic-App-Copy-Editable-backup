import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface AudioPlayerProps {
  audioUrl?: string;
  onDownload?: () => void;
}

export default function AudioPlayer({ audioUrl, onDownload }: AudioPlayerProps) {
  if (!audioUrl) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Generated Audio</h2>

      <div className="bg-black/30 rounded-md p-4 space-y-4">
        <audio controls src={audioUrl} className="w-full">
          Your browser does not support the audio element.
        </audio>

        {onDownload && (
          <Button
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            Download MP3
          </Button>
        )}
      </div>
    </div>
  );
}
