import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import PdfToText from "@/components/feature/PdfToText";
import { projectFormSchema, ProjectFormData } from "./schema";

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData & { pdfFile?: File }) => void;
  isSubmitting?: boolean;
}

export const ProjectForm = ({ onSubmit, isSubmitting = false }: ProjectFormProps) => {
  const [pdfFile, setPdfFile] = useState<File | undefined>();
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "Untitled Project",
      script: `EXT. PARK – DAY
NARRATOR: A gentle breeze moves through the trees as Mary and John walk.
MARY: It's peaceful here.
JOHN: Yeah, let's keep moving.`,
      doDirector: true,
      doAudio: false,
    },
  });

  const handleSubmit = (data: ProjectFormData) => {
    onSubmit({ ...data, pdfFile });
  };

  const handlePdfText = (text: string, mode: "replace" | "append" = "replace") => {
    if (mode === "replace") {
      form.setValue("script", text);
    } else {
      const currentScript = form.getValues("script");
      form.setValue("script", currentScript + "\n" + text);
    }
  };

  const handlePdfFile = (file: File) => {
    setPdfFile(file);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="My Project" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PDF upload helper */}
        <div className="mb-2">
          <PdfToText onText={handlePdfText} onPdfFile={handlePdfFile} />
          {pdfFile && (
            <p className="text-sm text-muted-foreground mt-2">
              PDF loaded: {pdfFile.name}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="script"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Script</FormLabel>
              <FormControl>
                <Textarea
                  rows={14}
                  placeholder="Paste your script here, or upload a PDF above…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-6">
          <FormField
            control={form.control}
            name="doDirector"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Run AI Director (analyze script)</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doAudio"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Generate Audio after analysis</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating Project..." : "Create Project"}
        </Button>
      </form>
    </Form>
  );
};
