import { Textarea } from "@/components/ui/textarea";
import PdfToText from "@/components/PdfToText";

interface ProjectFormProps {
  title: string;
  setTitle: (title: string) => void;
  script: string;
  setScript: (script: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export default function ProjectForm({
  title,
  setTitle,
  script,
  setScript,
  onSubmit,
  isSubmitting
}: ProjectFormProps) {
  // Handle PDF text extraction
  const handlePdfText = (text: string, mode: "replace" | "append" = "replace") => {
    if (mode === "replace") {
      setScript(text);
    } else {
      setScript((prev) => (prev ? `${prev}\n\n${text}` : text));
    }
  };
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title
        </label>
        <input
          id="title"
          className="w-full rounded-md border px-3 py-2 bg-black/20"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Project"
        />
      </div>

      {/* PDF upload helper */}
      <div className="mb-2">
        <PdfToText
          onText={handlePdfText}
        />
      </div>

      {/* Script textarea */}
      <div>
        <label htmlFor="script" className="block text-sm font-medium mb-2">
          Script
        </label>
        <Textarea
          id="script"
          rows={14}
          placeholder="Paste your script here, or upload a PDF above…"
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md px-4 py-2 bg-yellow-400 text-black disabled:opacity-60"
      >
        {isSubmitting ? "Working…" : "Create Project"}
      </button>
    </form>
  );
}
