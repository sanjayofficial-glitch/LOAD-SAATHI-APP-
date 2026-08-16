
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Home } from "lucide-react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] ${error.message}`, info);

    // Lazy-load PostHog to keep it off the critical bundle
    import("@/utils/posthog")
      .then(({ posthog }) => posthog.captureException(error, { component_stack: info.componentStack }))
      .catch(() => {});
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center w-full max-w-md">
            <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              An unexpected error occurred.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-400 mb-6 font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {this.state.error?.message || "Unknown error"}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="outline" onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2 border-gray-300 dark:border-gray-600">
                <Home className="h-4 w-4" /> Go Home
              </Button>
              <Button onClick={this.handleRefresh} className="bg-orange-600 hover:bg-orange-700 gap-2">
                <RefreshCw className="h-4 w-4" /> Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
