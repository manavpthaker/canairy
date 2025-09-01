/**
 * React Error Boundary Component with fallback UI and error reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private errorCounter = 0;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.errorCounter++;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState({
      errorInfo,
      errorCount: this.errorCounter
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service
    this.reportError(error, errorInfo);

    // Auto-reset after 10 seconds if error count is low
    if (this.errorCounter <= 3) {
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary();
      }, 10000);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    // Reset on prop changes if specified
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
    
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    // Send to error tracking service (e.g., Sentry, LogRocket)
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to your error tracking endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      }).catch(console.error);
    }
  }

  private resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    this.errorCounter = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error, errorCount } = this.state;
    const { children, fallback, isolate } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Isolated error boundary shows minimal UI
      if (isolate) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              Something went wrong in this section.
            </p>
            <button
              onClick={this.resetErrorBoundary}
              className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        );
      }

      // Full error boundary UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              <h1 className="mt-4 text-2xl font-bold text-center text-gray-900">
                Oops! Something went wrong
              </h1>
              
              <p className="mt-2 text-center text-gray-600">
                {errorCount > 3
                  ? "We're experiencing persistent issues. Please try again later."
                  : "An unexpected error occurred. The issue has been reported."}
              </p>

              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                    {error.message}
                    {'\n\n'}
                    {error.stack}
                  </pre>
                </details>
              )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={this.resetErrorBoundary}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </button>
              </div>

              {errorCount > 1 && (
                <p className="mt-4 text-xs text-center text-gray-500">
                  Error occurred {errorCount} times
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error handling
export function useErrorHandler() {
  return (error: Error) => {
    throw error; // This will be caught by the nearest error boundary
  };
}