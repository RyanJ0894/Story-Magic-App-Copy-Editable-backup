// src/pages/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./Index";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import NewProject from "./NewProject";

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
