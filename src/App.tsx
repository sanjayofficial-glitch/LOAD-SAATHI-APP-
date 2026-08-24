import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Skeleton } from "./components/ui/skeleton";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider, useTheme } from "@/theme/theme";
import { PostHogProvider } from "./components/PostHogProvider";
import { GoogleAnalyticsTracker } from "./components/GoogleAnalytics";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense } from "react";
import { AppRoutes } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ThemedToaster() {
  const { isDark } = useTheme();
  return <Toaster position="bottom-center" richColors theme={isDark ? 'dark' : 'light'} key={String(isDark)} />;
}

function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Configuration Error</h1>
          <p className="text-gray-600 dark:text-gray-400">Clerk Publishable Key is missing. Please check your environment variables.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <PostHogProvider>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        allowedRedirectOrigins={['http://localhost', 'https://localhost', 'http://localhost:5173', 'https://localhost:5173', 'https://loadsaathi.in', 'https://www.loadsaathi.in', 'https://in.loadsaathi.app', 'capacitor://localhost']}
        signUpFallbackRedirectUrl="/choose-role"
        signInFallbackRedirectUrl="/choose-role"
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
          <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <ScrollToTop />
              <GoogleAnalyticsTracker />
              <HelmetProvider>
              <Suspense fallback={<Skeleton className="h-dvh w-full" />}>
                <AppRoutes />
              </Suspense>
              </HelmetProvider>
            </BrowserRouter>
            <ThemedToaster />
          </AuthProvider>
        </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkProvider>
      </PostHogProvider>
    </ErrorBoundary>
  );
}

export default App;
