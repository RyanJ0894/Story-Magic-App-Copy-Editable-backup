// src/pages/Dashboard.tsx
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Your <span className="text-primary">Projects</span>
        </h1>

        <div className="flex items-center gap-3">
          {/* This was the small button on the right in your screenshot */}
          <Link
            to="/new"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
          >
            New Project
          </Link>
        </div>
      </div>

      {/* Empty state */}
      <div className="mt-16 rounded-lg border p-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg border">
          <span className="text-2xl">📁</span>
        </div>

        <h2 className="mb-2 text-xl font-semibold">No projects yet</h2>
        <p className="mb-8 text-sm text-muted-foreground">
          Create your first project to get started with Story Magic.
        </p>

        {/* This replaces the “Create Your First Project” button */}
        <button
          onClick={() => navigate("/new")}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-primary-foreground hover:opacity-90"
        >
          Create Your First Project
        </button>
      </div>
    </div>
  );
}
