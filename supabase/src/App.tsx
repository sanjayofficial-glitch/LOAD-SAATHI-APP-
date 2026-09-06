import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { ProductTourProvider } from "@/contexts/ProductTourContext";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Skeleton } from "./components/ui/skeleton";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider, useTheme } from "@/theme/theme";
import { PostHogProvider } from "./components/PostHogProvider";
import { GoogleAnalyticsTracker } from "./components/GoogleAnalytics";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, useState, useEffect, type ReactNode } from "react";
import { AppRoutes } from "./routes";
import "@/styles/product-tour.css";

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

function ClerkProviderWithRouter({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      allowedRedirectOrigins={['http://localhost', 'https://localhost', 'http://localhost:5173', 'https://localhost:5173', 'https://loadsaathi.in', 'https://www.loadsaathi.in', 'https://in.loadsaathi.app', 'capacitor://localhost', 'http://localhost:32126', 'http://localhost:42126']}
      signUpFallbackRedirectUrl="/choose-role"
      signInFallbackRedirectUrl="/choose-role"
      afterSignOutUrl="/"
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  );
}

function App() {
  const [clerkError, setClerkError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Listen for Clerk errors and handle them gracefully
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('clerk') || event.message?.includes('Clerk')) {
        setClerkError('Failed to load authentication. Please check your connection.');
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

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

  if (clerkError && !isRetrying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-2">Connection Issue</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{clerkError}</p>
          <button
            onClick={() => {
              setClerkError(null);
              setIsRetrying(true);
              window.location.reload();
            }}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <PostHogProvider>
        <BrowserRouter>
          <ClerkProviderWithRouter>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <ThemeProvider>
                   <AuthProvider>
                     <ProductTourProvider>
                       <LocationProvider>
                         <ScrollToTop />
                         <GoogleAnalyticsTracker />
                         <Suspense fallback={<Skeleton className="h-dvh w-full" />}>
                           <AppRoutes />
                         </Suspense>
                         <ThemedToaster />
                       </LocationProvider>
                     </ProductTourProvider>
                   </AuthProvider>
                </ThemeProvider>
              </TooltipProvider>
            </QueryClientProvider>
          </ClerkProviderWithRouter>
        </BrowserRouter>
      </PostHogProvider>
    </ErrorBoundary>
  );
}

export default App;
