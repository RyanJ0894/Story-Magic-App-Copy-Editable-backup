// src/pages/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewProject from "./pages/NewProject";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signin" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects/new" element={<NewProject />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
