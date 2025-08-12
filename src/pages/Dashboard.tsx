// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";

type ProjectRow = { id: string; title: string | null; created_at: string };

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_projects")
          .select("id,title,created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (alive) setProjects(data as ProjectRow[]);
      } catch (e: any) {
        setErr(e.message || "Failed to load projects");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 text-foreground">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Projects</h1>
        <Link
          to="/projects/new"
          className="rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:opacity-90"
        >
          + Create New Project
        </Link>
      </div>

      {loading && <div>Loading…</div>}
      {err && <div className="text-red-500">{err}</div>}

      {!loading && !err && projects.length === 0 && (
        <div className="opacity-75">No projects yet. Create your first one.</div>
      )}

      <ul className="space-y-3">
        {projects.map((p) => (
          <li key={p.id} className="rounded-xl border border-border p-4">
            <div className="font-medium">{p.title || "Untitled Project"}</div>
            <div className="text-sm opacity-70">{new Date(p.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
