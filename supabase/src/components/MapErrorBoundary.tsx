import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type Props = {
  children: ReactNode;
  /** Minimum height for the fallback so the surrounding layout doesn't collapse. */
  minHeight?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * MapErrorBoundary — a small, scoped error boundary for map components.
 *
 * The full-page <ErrorBoundary> replaces the entire route on error, which is
 * too aggressive for a map that lives inside a trip detail page or a dashboard
 * widget. This boundary catches render-time errors thrown by Leaflet (missing
 * tiles, container issues, etc.) and shows an inline retry card so the rest
 * of the page stays interactive.
 */
export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Lazy-load PostHog so this boundary stays off the critical bundle.
    import('@/utils/posthog')
      .then(({ posthog }) => posthog.captureException(error, { component_stack: info.componentStack, source: 'map_error_boundary' }))
      .catch(() => {});
    console.error('[MapErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6 text-center"
          style={{ minHeight: this.props.minHeight ?? 'min(200px, 30vh)' }}
        >
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Map failed to load</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleRetry} className="gap-2">
            <RefreshCw className="h-3 w-3" /> Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default MapErrorBoundary;