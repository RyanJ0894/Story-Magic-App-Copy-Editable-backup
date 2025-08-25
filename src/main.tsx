import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ErrorBoundary } from '@/components/ErrorBoundary'

console.log('🚀 main.tsx: Starting app initialization');

// Initialize integrations after main app setup
try {
  console.log('📡 main.tsx: Loading Supabase client');
  await import("./integrations/supabase/client");
  console.log('✅ main.tsx: Supabase client loaded');
} catch (error) {
  console.error('❌ main.tsx: Failed to load Supabase client:', error);
}

try {
  console.log('🎬 main.tsx: Loading film director API');
  await import("./integrations/filmDirectorApi");
  console.log('✅ main.tsx: Film director API loaded');
} catch (error) {
  console.error('❌ main.tsx: Failed to load film director API:', error);
}

const rootElement = document.getElementById("root");
console.log('🎯 main.tsx: Root element found:', !!rootElement);

if (rootElement) {
  console.log('🔄 main.tsx: Creating React root');
  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('✅ main.tsx: React app rendered');
} else {
  console.error('❌ main.tsx: Root element not found!');
}

