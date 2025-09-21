import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PdfToText from "@/components/feature/PdfToText";
import { UseFormRegister, FieldErrors } from "react-hook-form";

interface ProjectFormData {
  title: string;
  script: string;
  doDirector: boolean;
  doAudio: boolean;
}

interface ProjectFormProps {
  register: UseFormRegister<ProjectFormData>;
  errors: FieldErrors<ProjectFormData>;
  isSubmitting: boolean;
}

export default function ProjectForm({
  register,
  errors,
  isSubmitting
}: ProjectFormProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title" className="block text-sm font-medium mb-2">
          Title
        </Label>
        <Input
          id="title"
          {...register("title", { required: "Title is required" })}
          placeholder="My Project"
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* PDF upload helper */}
      <div className="mb-2">
        <PdfToText
          onText={(text: string, mode: "replace" | "append" = "replace") => {
            // TODO: Handle PDF text extraction with react-hook-form
            console.log("PDF text:", text, mode);
          }}
        />
      </div>

      {/* Script textarea */}
      <div>
        <Label htmlFor="script" className="block text-sm font-medium mb-2">
          Script
        </Label>
        <Textarea
          id="script"
          rows={14}
          placeholder="Paste your script here, or upload a PDF above…"
          {...register("script", { required: "Script is required" })}
        />
        {errors.script && (
          <p className="text-sm text-red-500 mt-1">{errors.script.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md px-4 py-2 bg-yellow-400 text-black disabled:opacity-60"
      >
        {isSubmitting ? "Working…" : "Create Project"}
      </button>
    </div>
  );
}
