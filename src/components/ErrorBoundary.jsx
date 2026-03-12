import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Only catch removeChild errors, let other errors through
    if (error?.message?.includes('removeChild')) {
      console.warn('Suppressed removeChild error:', error.message);
      return { hasError: false }; // Don't show error UI
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log removeChild errors but don't crash the app
    if (error?.message?.includes('removeChild')) {
      console.warn('DOM cleanup error (non-critical):', error.message);
      // Reset error state to allow app to continue
      this.setState({ hasError: false, error: null });
      return;
    }
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
          <div className="bg-surface-primary rounded-2xl border border-border-secondary p-8 max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">Something went wrong</h2>
            <p className="text-text-secondary mb-4">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
