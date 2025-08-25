import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🔥 ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔥 ErrorBoundary componentDidCatch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-foreground mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              The application encountered an error. Please refresh the page.
            </p>
            <details className="mb-4">
              <summary className="text-sm text-muted-foreground cursor-pointer">
                Error details
              </summary>
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}