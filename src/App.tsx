// src/pages/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import NewProject from "@/pages/NewProject";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signin" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* New Project page */}
        <Route path="/new" element={<NewProject />} />

        {/* Back-compat: if anyone tries /newproject, send them to /new */}
        <Route path="/newproject" element={<Navigate to="/new" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
