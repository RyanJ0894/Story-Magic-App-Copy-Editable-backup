import "./integrations/supabase/client";
import "./integrations/filmDirectorApi";
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/hooks/useAuth'

console.log('main.tsx loading...');
console.log('App component:', App);

const rootElement = document.getElementById("root");
console.log('Root element:', rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App rendered successfully');
} else {
  console.error('Root element not found!');
}

