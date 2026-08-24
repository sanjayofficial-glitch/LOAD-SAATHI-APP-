
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Skeleton } from "./components/ui/skeleton";
import ScrollToTop from "./components/ScrollToTop";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { ThemeProvider, useTheme } from "@/theme/theme";
import { PostHogProvider } from "./components/PostHogProvider";
import { GoogleAnalyticsTracker } from "./components/GoogleAnalytics";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";

// Layout (authenticated shell) is lazy so public pages never download its
// heavy dependencies (framer-motion dock, NotificationBell, supabase client).
const Layout = lazy(() => import("./components/Layout"));
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ChooseRole = lazy(() => import("./pages/ChooseRole"));
const OnboardingFlow = lazy(() => import("./pages/OnboardingFlow"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PublicLayout = lazy(() => import("./components/PublicLayout"));
const Features = lazy(() => import("./pages/public/Features"));
const HowItWorks = lazy(() => import("./pages/public/HowItWorks"));
const About = lazy(() => import("./pages/public/About"));
const Pricing = lazy(() => import("./pages/public/Pricing"));
const Faq = lazy(() => import("./pages/public/FAQ"));
const FareCalculator = lazy(() => import("./pages/public/FareCalculator"));
const SharedTrip = lazy(() => import("./pages/public/SharedTrip"));
const SharedShipment = lazy(() => import("./pages/public/SharedShipment"));
const Contact = lazy(() => import("./pages/public/Contact"));
const SafetyTrust = lazy(() => import("./pages/public/SafetyTrust"));
const Privacy = lazy(() => import("./pages/public/Privacy"));
const Terms = lazy(() => import("./pages/public/Terms"));
const ShipperSolution = lazy(() => import("./pages/public/ShipperSolution"));
const TruckerSolution = lazy(() => import("./pages/public/TruckerSolution"));
const DashboardPreview = lazy(() => import("./features/marketing/screens/DashboardPreview"));
const MatchingPreview = lazy(() => import("./features/marketing/screens/MatchingPreview"));
const ChatPreview = lazy(() => import("./features/marketing/screens/ChatPreview"));
const CreditScorePreview = lazy(() => import("./features/marketing/screens/CreditScorePreview"));
const ReviewsPreview = lazy(() => import("./features/marketing/screens/ReviewsPreview"));
const AdminPreview = lazy(() => import("./features/marketing/screens/AdminPreview"));
const BlogList = lazy(() => import("./pages/blog/BlogList"));
const BlogArticle = lazy(() => import("./pages/blog/BlogArticle"));
const LocationPage = lazy(() => import("./pages/public/locations/LocationPage"));
const GuidePage = lazy(() => import("./pages/public/guides/GuidePage"));
const RoutesIndex = lazy(() => import("./pages/public/RoutesIndex"));
const RouteDetail = lazy(() => import("./pages/public/RouteDetail"));
const Comparison = lazy(() => import("./pages/public/Comparison"));
const TruckerDashboard = lazy(() => import("./pages/trucker/Dashboard"));
const PostTrip = lazy(() => import("./pages/trucker/PostTrip"));
const TruckerHub = lazy(() => import("./pages/trucker/TruckerHub"));
const EditTrip = lazy(() => import("./pages/trucker/EditTrip"));
const TruckerTripDetail = lazy(() => import("./pages/trucker/TruckerTripDetail"));
const BrowseShipments = lazy(() => import("./pages/trucker/BrowseShipments"));
const BrowseTrips = lazy(() => import("./pages/shipper/BrowseTrips"));
const TruckerHistory = lazy(() => import("./pages/trucker/TruckerHistory"));
const ShipperDashboard = lazy(() => import("./pages/shipper/Dashboard"));
const PostShipments = lazy(() => import("./pages/shipper/PostShipments"));
const MyShipments = lazy(() => import("./pages/shipper/MyShipments"));
const ShipmentDetail = lazy(() => import("./pages/shipper/ShipmentDetail"));
const EditShipment = lazy(() => import("./pages/shipper/EditShipment"));
const ShipperHistory = lazy(() => import("./pages/shipper/ShipperHistory"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const Chat = lazy(() => import("./pages/Chat"));
const ChatList = lazy(() => import("./pages/ChatList"));
const Profile = lazy(() => import("./pages/Profile"));
const MonitoringDashboard = lazy(() => import("./pages/admin/MonitoringDashboard"));
const CommandCenterLive = lazy(() => import("./pages/admin/CommandCenterLive"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const Moderation = lazy(() => import("./pages/admin/Moderation"));
const Favorites = lazy(() => import("./pages/Favorites"));
const CreditScore = lazy(() => import("./pages/CreditScore"));
const Gallery = lazy(() => import("./pages/public/Gallery"));
const ReturnLoad = lazy(() => import("./pages/public/commercial/ReturnLoad"));
const PtlTransport = lazy(() => import("./pages/public/commercial/PtlTransport"));
const LtlTransport = lazy(() => import("./pages/public/commercial/LtlTransport"));
const TruckLoadBooking = lazy(() => import("./pages/public/commercial/TruckLoadBooking"));
const FreightMarketplace = lazy(() => import("./pages/public/commercial/FreightMarketplace"));
const TransportCostCalculator = lazy(() => import("./pages/public/tools/TransportCostCalculator"));
const TruckLoadCalculator = lazy(() => import("./pages/public/tools/TruckLoadCalculator"));
const PtlVsFtlCalculator = lazy(() => import("./pages/public/tools/PtlVsFtlCalculator"));
const FreightRateCalculator = lazy(() => import("./pages/public/tools/FreightRateCalculator"));
const ReturnLoadCalculator = lazy(() => import("./pages/public/tools/ReturnLoadCalculator"));
const ForMsmes = lazy(() => import("./pages/public/ForMsmes"));
const AiLogistics = lazy(() => import("./pages/public/AiLogistics"));
const Data = lazy(() => import("./pages/public/Data"));
const GalleryManager = lazy(() => import("./pages/admin/GalleryManager"));
const TeamManager = lazy(() => import("./pages/admin/TeamManager"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
        allowedRedirectOrigins={['http://localhost', 'https://localhost', 'http://localhost:5173', 'https://localhost:5173', 'https://loadsaathi.in', 'https://www.loadsaathi.in', 'https://in.loadsaathi.app', 'capacitor://localhost', 'https://clerk.loadsaathi.in']}
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
                <Routes>
                  {/* Public routes with individual error boundaries */}
                  <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                  <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
                  <Route path="/choose-role" element={<ErrorBoundary><ChooseRole /></ErrorBoundary>} />
                  <Route path="/onboarding" element={<ErrorBoundary><OnboardingFlow /></ErrorBoundary>} />
                  <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />

                  {/* Public info pages wrapped in PublicLayout */}
                  <Route element={<PublicLayout><Outlet /></PublicLayout>}>
                    <Route index element={<Index />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/faq" element={<Faq />} />
                    <Route path="/fare-calculator" element={<FareCalculator />} />
                    <Route path="/share/trip/:id" element={<SharedTrip />} />
                    <Route path="/share/shipment/:id" element={<SharedShipment />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/safety-trust" element={<SafetyTrust />} />
                    <Route path="/compare" element={<Comparison />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/solutions/shippers" element={<ShipperSolution />} />
                    <Route path="/solutions/truckers" element={<TruckerSolution />} />

                    {/* App Screen Previews */}
                    <Route path="/screens/dashboard" element={<DashboardPreview />} />
                    <Route path="/screens/matching" element={<MatchingPreview />} />
                    <Route path="/screens/chat" element={<ChatPreview />} />
                    <Route path="/screens/credit-score" element={<CreditScorePreview />} />
                    <Route path="/screens/reviews" element={<ReviewsPreview />} />
                    <Route path="/screens/admin" element={<AdminPreview />} />

                    {/* Blog */}
                    <Route path="/blog" element={<BlogList />} />
                    <Route path="/blog/:slug" element={<BlogArticle />} />

                    {/* Freight Routes */}
                    <Route path="/routes" element={<RoutesIndex />} />
                    <Route path="/routes/:slug" element={<RouteDetail />} />

                    {/* Location Pages */}
                    <Route path="/location/:city" element={<LocationPage />} />

                    {/* Guide Pages */}
                    <Route path="/guide/:slug" element={<GuidePage />} />

                    {/* Gallery */}
                    <Route path="/gallery" element={<Gallery />} />

                    {/* Commercial Hub Pages */}
                    <Route path="/return-load" element={<ReturnLoad />} />
                    <Route path="/ptl-transport" element={<PtlTransport />} />
                    <Route path="/ltl-transport" element={<LtlTransport />} />
                    <Route path="/truck-load-booking" element={<TruckLoadBooking />} />
                    <Route path="/freight-marketplace" element={<FreightMarketplace />} />

                    {/* Tool Calculators */}
                    <Route path="/transport-cost-calculator" element={<TransportCostCalculator />} />
                    <Route path="/truck-load-calculator" element={<TruckLoadCalculator />} />
                    <Route path="/ptl-vs-ftl-calculator" element={<PtlVsFtlCalculator />} />
                    <Route path="/freight-rate-calculator" element={<FreightRateCalculator />} />
                    <Route path="/return-load-calculator" element={<ReturnLoadCalculator />} />

                    {/* Cluster Pages */}
                    <Route path="/for-msmes" element={<ForMsmes />} />
                    <Route path="/ai-logistics" element={<AiLogistics />} />

                    {/* Data Intelligence Hub */}
                    <Route path="/data" element={<Data />} />
                    <Route path="/freight-intelligence" element={<Data />} />

                    {/* Transport by City (alias for /location/:city) */}
                    <Route path="/transport/:city" element={<LocationPage />} />
                  </Route>

                  {/* Authenticated routes wrapped with Layout */}
                  <Route
                    element={
                      <Layout>
                        <RoleProtectedRoute allowedRole="both">
                          <Outlet />
                        </RoleProtectedRoute>
                      </Layout>
                    }
                  >
                    {/* Admin routes */}
                    <Route path="/admin/monitoring" element={
                      <RoleProtectedRoute allowedRole="admin">
                        <MonitoringDashboard />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/admin/command-center" element={
                      <RoleProtectedRoute allowedRole="admin">
                        <CommandCenterLive />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/admin/dashboard" element={
                      <RoleProtectedRoute allowedRole="admin">
                        <AdminDashboard />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                      <RoleProtectedRoute allowedRole="admin">
                        <UserManagement />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/admin/moderation" element={
                      <RoleProtectedRoute allowedRole="admin">
                        <Moderation />
                      </RoleProtectedRoute>
                    } />
                    {/* Admin gallery + team routes */}
                    <Route path="/admin/gallery" element={
                      <RoleProtectedRoute allowedRole="admin">
                        <GalleryManager />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/admin/team" element={
                      <RoleProtectedRoute allowedRole="admin">
                        <TeamManager />
                      </RoleProtectedRoute>
                    } />
                    {/* Trucker routes */}
                    <Route path="/trucker/dashboard" element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <TruckerDashboard />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/trucker/post-trip" element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <PostTrip />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/trucker/my-trips" element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <TruckerHub />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/trucker/trips/:tripId/edit" element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <EditTrip />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/trucker/trips/:tripId" element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <TruckerTripDetail />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/trucker/history" element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <TruckerHistory />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/trucker/browse-shipments" element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <BrowseShipments />
                      </RoleProtectedRoute>
                    } />

                    {/* Shipper routes */}
                    <Route path="/shipper/dashboard" element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <ShipperDashboard />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/shipper/post-shipment" element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <PostShipments />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/shipper/my-shipments" element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <MyShipments />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/shipper/shipments/:id" element={<RoleProtectedRoute allowedRole="shipper"><ShipmentDetail /></RoleProtectedRoute>} />
                    <Route path="/shipper/shipments/:shipmentId/edit" element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <EditShipment />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/shipper/history" element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <ShipperHistory />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/browse-trucks" element={
                      <RoleProtectedRoute allowedRole="both">
                        <BrowseTrips />
                      </RoleProtectedRoute>
                    } />

                    {/* Common authenticated routes */}
                    <Route path="/trips/:tripId" element={<TripDetail />} />
                    <Route path="/chat/:requestId" element={<Chat />} />
                    <Route path="/messages" element={<ChatList />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/credit-score" element={<CreditScore />} />
                  </Route>

                  {/* Catch-all (top-level: public unknown URLs must show 404, not redirect to /) */}
                  <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
                </Routes>
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