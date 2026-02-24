"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // In production, you would send this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to error reporting service like Sentry
      // logErrorToService(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#101922] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-[#1c2630] rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-red-500">
                error
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              عذراً، حدث خطأ
            </h2>
            <p className="text-gray-400 mb-6">
              حدث خطأ غير متوقع. يرجى تحديث الصفحة أو المحاولة مرة أخرى لاحقاً.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#137fec] text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors"
            >
              تحديث الصفحة
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mt-6 p-4 bg-[#101922] rounded-lg text-left overflow-auto">
                <p className="text-red-400 text-sm font-mono">
                  {this.state.error.message}
                </p>
                <pre className="text-gray-500 text-xs mt-2 font-mono">
                  {this.state.error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
