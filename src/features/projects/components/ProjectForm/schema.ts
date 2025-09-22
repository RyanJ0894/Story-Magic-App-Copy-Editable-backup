import { z } from "zod";

export const projectFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  script: z.string().min(10, "Script must be at least 10 characters"),
  doDirector: z.boolean().default(true),
  doAudio: z.boolean().default(false),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;
