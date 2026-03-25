"use client";

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-mesh-with-grid flex items-center justify-center px-4">
          <div className="glass-panel rounded-2xl p-8 max-w-md w-full border-(--danger)/40 glow text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--danger)/20 flex items-center justify-center">
              <span className="text-2xl">💥</span>
            </div>
            <h1 className="font-display text-xl tracking-wider text-(--danger) mb-2">
              Something Went Wrong
            </h1>
            <p className="text-(--text-muted) text-sm mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 rounded-xl bg-(--neon)/20 border border-(--neon)/50 text-(--neon) font-display tracking-wider hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] transition"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-3 rounded-xl bg-(--text-muted)/10 border border-(--text-muted)/30 text-(--text-muted) font-display tracking-wider hover:bg-(--text-muted)/20 transition"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-(--text-muted) text-xs mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs bg-(--bg-elevated) p-3 rounded-lg overflow-auto max-h-32 text-(--danger)">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;