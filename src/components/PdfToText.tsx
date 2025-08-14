// src/components/PdfToText.tsx
import React, { useRef, useState } from "react";

// We load pdfjs dynamically so bundlers don't choke.
// Lovable will install pdfjs-dist when it sees the import on build.
export default function PdfToText({
  onText,
  replace = true,
}: {
  onText: (text: string, mode: "replace" | "append") => void;
  replace?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<"replace" | "append">(replace ? "replace" : "append");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function extractPdfText(file: File): Promise<string> {
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    // @ts-ignore - worker entry path for pdfjs
    const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.entry");
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

    const arrayBuf = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuf });
    const pdf = await loadingTask.promise;

    let fullText = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const pageText = content.items.map((i: any) => ("str" in i ? i.str : "")).join(" ");
      fullText += (fullText ? "\n\n" : "") + pageText.trim();
    }
    return fullText.trim();
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      setErr("Please choose a PDF file.");
      return;
    }
    setBusy(true);
    try {
      const text = await extractPdfText(f);
      onText(text, mode);
    } catch (e: any) {
      setErr(e?.message || "Failed to read PDF.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={onPick}
        disabled={busy}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white"
        aria-label="Upload PDF"
      >
        {busy ? "Reading PDF…" : "Upload PDF"}
      </button>

      <label className="text-sm flex items-center gap-2">
        <input
          type="radio"
          name="pdf-mode"
          checked={mode === "replace"}
          onChange={() => setMode("replace")}
        />
        Replace text
      </label>
      <label className="text-sm flex items-center gap-2">
        <input
          type="radio"
          name="pdf-mode"
          checked={mode === "append"}
          onChange={() => setMode("append")}
        />
        Append text
      </label>

      {err && <span className="text-red-400 text-sm">{err}</span>}
    </div>
  );
}
