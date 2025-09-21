import { UseFormRegister, FieldErrors } from "react-hook-form";

interface ProjectFormData {
  title: string;
  script: string;
  doDirector: boolean;
  doAudio: boolean;
}

interface ProjectOptionsProps {
  register: UseFormRegister<ProjectFormData>;
  errors: FieldErrors<ProjectFormData>;
}

export default function ProjectOptions({
  register,
  errors
}: ProjectOptionsProps) {
  return (
    <div className="flex items-center gap-6">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          {...register("doDirector")}
        />
        <span>Run AI Director (analyze script)</span>
      </label>

      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          {...register("doAudio")}
        />
        <span>Generate Audio after analysis</span>
      </label>
    </div>
  );
}
