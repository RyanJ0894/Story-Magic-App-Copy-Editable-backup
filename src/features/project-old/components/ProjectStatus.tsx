interface ProjectStatusProps {
  projectId?: string;
  status?: string;
  error?: string;
  isCreating?: boolean;
}

export default function ProjectStatus({
  projectId,
  status,
  error,
  isCreating
}: ProjectStatusProps) {
  if (!projectId && !status && !error && !isCreating) {
    return null;
  }

  return (
    <div className="mt-8 space-y-3">
      {status && <p className="text-sm opacity-80">Status: {status}</p>}
      {projectId && (
        <p className="text-sm">
          Project ID: <code className="opacity-80">{projectId}</code>{" "}
          (<a className="underline" href="/dashboard">Go to Dashboard</a>)
        </p>
      )}
      {error && <p className="text-red-400 text-sm">Error: {error}</p>}
    </div>
  );
}
