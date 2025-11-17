// src/components/PdfToText.tsx
import React, { useRef, useState } from "react";
import {
  GlobalWorkerOptions,
  getDocument,
} from "pdfjs-dist";

// Set worker source to use bundled version
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

type Props = {
  onText: (txt: string, mode?: "replace" | "append") => void;
  onPdfFile?: (file: File) => void; // New: pass the actual PDF file
};

export default function PdfToText({ onText, onPdfFile }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  async function extractText(file: File) {
    setErr("");
    setBusy(true);
    try {
      // Pass the original PDF file to parent if callback provided
      if (onPdfFile) {
        onPdfFile(file);
      }

      const buffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: buffer }).promise;

      let out = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const text = content.items
          .map((item: any) => (typeof item.str === "string" ? item.str : ""))
          .join(" ");
        out += text + "\n\n";
      }

      onText(out.trim(), mode);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        ref={fileRef}
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) extractText(f);
          e.currentTarget.value = ""; // allow re-uploading same file
        }}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="rounded-md px-4 py-2 bg-yellow-400 text-black disabled:opacity-60"
        disabled={busy}
      >
        {busy ? "Processing…" : "Upload PDF"}
      </button>

      <label className="inline-flex items-center gap-2">
        <input
          type="radio"
          name="pdf-mode"
          checked={mode === "replace"}
          onChange={() => setMode("replace")}
        />
        <span>Replace text</span>
      </label>

      <label className="inline-flex items-center gap-2">
        <input
          type="radio"
          name="pdf-mode"
          checked={mode === "append"}
          onChange={() => setMode("append")}
        />
        <span>Append text</span>
      </label>

      {err && <span className="text-red-400 text-sm">Error: {err}</span>}
    </div>
  );
}