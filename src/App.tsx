import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import Pricing from "./pages/Pricing";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import ShowAudio from "./pages/ShowAudio";
import ScriptPlayerDemo from "./features/scripts/components/ScriptPlayerDemo";

function App() {
  console.log("📱 App: Component rendering");
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signin" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/projects/new" element={<NewProject />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/show-audio" element={<ShowAudio />} />
        <Route path="/script-demo" element={<ScriptPlayerDemo />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
