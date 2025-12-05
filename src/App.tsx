import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import Pricing from "./pages/Pricing";
import { AcceptInvitationView } from "./features/auth/views/AcceptInvitationView";
import { ResetPasswordView } from "./features/auth/views/ResetPasswordView";
import ShowAudio from "./pages/ShowAudio";
import ScriptPlayerDemo from "./features/scripts/components/ScriptPlayerDemo";
import { MainLayout } from "./components/layout/MainLayout";

function App() {
  console.log("📱 App: Component rendering");
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signin" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
        <Route path="/dashboard" element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        } />
        <Route path="/accept-invitation" element={<AcceptInvitationView />} />
        <Route path="/projects/new" element={
          <MainLayout>
            <NewProject />
          </MainLayout>
        } />
        <Route path="/projects/:id" element={
          <MainLayout>
            <ProjectDetail />
          </MainLayout>
        } />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/show-audio" element={<ShowAudio />} />
        <Route path="/script-demo" element={<ScriptPlayerDemo chunks={[]} isVisible={true} />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
