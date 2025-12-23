// src/components/PdfToText.tsx
import React, { useRef, useState } from "react";
import {
  GlobalWorkerOptions,
  getDocument,
  version,
} from "pdfjs-dist";

// Set worker source to use CDN for production reliability
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

type Props = {
  onText: (txt: string, mode?: "replace" | "append", filename?: string) => void;
};

export default function PdfToText({ onText }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  async function extractText(file: File) {
    setErr("");
    setBusy(true);
    try {
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

      const filename = file.name.replace(/\.pdf$/i, '');
      onText(out.trim(), "replace", filename);
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
        className="rounded-md px-4 py-2 bg-yellow-400 text-black disabled:opacity-60 w-full sm:w-auto"
        disabled={busy}
      >
        {busy ? "Processing…" : <><span className="sm:hidden">Upload Script</span><span className="hidden sm:inline">Upload PDF</span></>}
      </button>

      {err && <span className="text-red-400 text-sm">Error: {err}</span>}
    </div>
  );
}