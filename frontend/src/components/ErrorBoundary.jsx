import React from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary caught:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white font-inter px-6 py-8 flex items-center justify-center">
          <div className="max-w-md rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-300 mx-auto mb-6 shadow-[0_0_24px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-slate-400 text-sm mb-6">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.resetError}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-medium hover:shadow-lg transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/dashboard"}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
