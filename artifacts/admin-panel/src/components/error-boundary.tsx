import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can log the error to an external service here
    // console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-xl w-full bg-card border border-border rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">An unexpected error occurred while rendering this page.</p>
            {this.state.error && (
              <details className="text-xs text-muted-foreground mb-4 whitespace-pre-wrap text-left overflow-auto max-h-40">
                {String(this.state.error.stack || this.state.error.message)}
              </details>
            )}
            <div className="flex justify-center gap-2">
              <button className="px-3 py-1.5 rounded bg-primary text-primary-foreground" onClick={() => window.location.reload()}>Reload</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
