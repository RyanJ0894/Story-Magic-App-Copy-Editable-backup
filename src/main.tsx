import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

console.log('🚀 main.tsx: Starting app initialization');

// Initialize integrations (no top-level await needed)
import "./integrations/supabase/client";
import "./integrations/filmDirectorApi";

const rootElement = document.getElementById("root");
console.log('🎯 main.tsx: Root element found:', !!rootElement);

const queryClient = new QueryClient();

if (rootElement) {
  console.log('🔄 main.tsx: Creating React root');
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </AuthProvider>
      </ErrorBoundary>
    </StrictMode>
  );
  console.log('✅ main.tsx: React app rendered');
} else {
  console.error('❌ main.tsx: Root element not found!');
}

