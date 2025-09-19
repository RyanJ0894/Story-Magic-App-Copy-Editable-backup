interface ProjectOptionsProps {
  doDirector: boolean;
  setDoDirector: (value: boolean) => void;
  doAudio: boolean;
  setDoAudio: (value: boolean) => void;
}

export default function ProjectOptions({
  doDirector,
  setDoDirector,
  doAudio,
  setDoAudio
}: ProjectOptionsProps) {
  return (
    <div className="flex items-center gap-6">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={doDirector}
          onChange={(e) => setDoDirector(e.target.checked)}
        />
        <span>Run AI Director (analyze script)</span>
      </label>

      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={doAudio}
          onChange={(e) => setDoAudio(e.target.checked)}
        />
        <span>Generate Audio after analysis</span>
      </label>
    </div>
  );
}
