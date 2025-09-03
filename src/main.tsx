import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ErrorBoundary } from '@/components/ErrorBoundary'

console.log('🚀 main.tsx: Starting app initialization');

// Initialize integrations (no top-level await needed)
import "./integrations/supabase/client";
import "./integrations/filmDirectorApi";

const rootElement = document.getElementById("root");
console.log('🎯 main.tsx: Root element found:', !!rootElement);

if (rootElement) {
  console.log('🔄 main.tsx: Creating React root');
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </StrictMode>
  );
  console.log('✅ main.tsx: React app rendered');
} else {
  console.error('❌ main.tsx: Root element not found!');
}

