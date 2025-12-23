import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import PdfToText from "@/components/feature/PdfToText";
import { projectFormSchema, ProjectFormData } from "./schema";
import { Sparkles } from "lucide-react";

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  isSubmitting?: boolean;
}

export const ProjectForm = ({ onSubmit, isSubmitting = false }: ProjectFormProps) => {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "Untitled Project",
      script: "",
      doDirector: true,
      doAudio: false,
    },
  });

  const scriptValue = form.watch("script");
  const hasScript = scriptValue && scriptValue.trim().length > 0;

  const handleSubmit = (data: ProjectFormData) => {
    onSubmit(data);
  };

  const handlePdfText = (text: string, mode: "replace" | "append" = "replace", filename?: string) => {
    if (mode === "replace") {
      form.setValue("script", text);
      if (filename) {
        form.setValue("title", filename);
      }
    } else {
      const currentScript = form.getValues("script");
      form.setValue("script", currentScript + "\n" + text);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Inspirational Message */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-slate-800 dark:text-slate-300" />
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-300">
              Let's Make Magic
            </h2>
            <Sparkles className="w-8 h-8 text-slate-800 dark:text-slate-300" />
          </div>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Upload your script and watch it transform into a cinematic audio experience
          </p>
        </div>

        {/* PDF upload */}
        <div className="flex justify-center">
          <PdfToText onText={handlePdfText} />
        </div>

        {/* Hidden script field - populated by PDF upload */}
        <input type="hidden" {...form.register("script")} />

        {/* Show confirmation when script is loaded */}
        {hasScript && (
          <div className="text-center p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-300 font-medium">Script loaded successfully</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-6">
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

        <Button 
          type="submit" 
          disabled={isSubmitting || !hasScript} 
          className="w-full"
          variant="cinema"
          size="lg"
        >
          {isSubmitting ? "Creating Project..." : "Create Project"}
        </Button>

        {!hasScript && (
          <p className="text-center text-sm text-muted-foreground">
            Upload a PDF script to get started
          </p>
        )}
      </form>
    </Form>
  );
};
