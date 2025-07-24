import React from "react";
import { Header } from "@/components/Header";
import { ProjectsList } from "@/components/ProjectsList";
import { AuthGuard } from "@/components/AuthGuard";

const Dashboard = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <ProjectsList />
        </main>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;