import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSignUp, useUser } from "@clerk/clerk-react";
import { Capacitor } from "@capacitor/core";
import LogoMark from "@/components/LogoMark";
import SeoMeta from "@/components/SeoMeta";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDisha } from "@/components/DishaContext.hooks";
import { useDishaGuide } from "@/components/DishaGuideProvider.hooks";
import { useMascotFormWatcher } from "@/hooks/useMascotFormWatcher";
import { trackRegisterStarted } from "@/utils/analytics";

const Register = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useUser();
  const { userProfile } = useAuth();
  const { triggerErrorReaction, triggerSuccessReaction } = useDisha();
  const { handleClick: guideHandleClick } = useDishaGuide();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleType = searchParams.get("type");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  useMascotFormWatcher({
    autoStartFlow: 'signup',
    fields: [
      {
        key: 'email',
        selector: '[data-guide="email"]',
        tip: 'Enter your email address to get started.',
      },
      {
        key: 'password',
        selector: '[data-guide="password"]',
        tip: 'Use 8+ characters with a mix of letters, numbers, and symbols.',
      },
      {
        key: 'fullName',
        selector: '[data-guide="full-name"]',
        tip: 'This is how other users will know you on the platform.',
      },
      {
        key: 'oauth',
        selector: '[data-guide="oauth-google"]',
        tip: 'Or sign up quickly with your Google account.',
      },
    ],
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (userProfile?.user_type === "shipper") navigate("/shipper/dashboard", { replace: true });
    else if (userProfile?.user_type === "trucker") navigate("/trucker/dashboard", { replace: true });
    else if (userProfile?.user_type === "admin") navigate("/admin/monitoring", { replace: true });
    else navigate("/choose-role", { replace: true });
  }, [isLoaded, isSignedIn, userProfile, navigate]);

  // Track register page view
  useEffect(() => {
    const source = searchParams.get("source") || "direct";
    trackRegisterStarted({ source, role: roleType as "shipper" | "trucker" | undefined });
  }, [roleType, searchParams]);

  // Where to send a brand-new user after their account exists but no role is
  // saved yet. The role picked on the page that linked here (via ?type=) is
  // carried forward so /choose-role can pre-select it — no duplicate step.
  const rolePath = () => `/choose-role${roleType ? `?type=${encodeURIComponent(roleType)}` : ""}`;

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      // In Capacitor Android, use full URL for redirect so the intent filter captures it
      const redirectBase = Capacitor.isNativePlatform()
        ? "https://in.loadsaathi.app"
        : window.location.origin;
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${redirectBase}${rolePath()}`,
        redirectUrlComplete: `${redirectBase}${rolePath()}`,
      });
    } catch (err) {
      console.error("Google sign-up error:", err);
      const msg = (err as { message?: string })?.message || "Google sign-up failed. Please try again.";
      setError(msg.includes("network") ? "Network error. Check your connection and try again." : msg);
      triggerErrorReaction(msg.includes("network") ? "Network error. Check your connection and try again." : msg);
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !firstName || !email || !password) return;
    setLoading(true);
    setError("");
    try {
      await signUp.create({
        firstName,
        lastName: lastName || undefined,
        emailAddress: email,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err) {
      console.error("Email sign-up error:", err);
      const signUpErr = err as { errors?: { message?: string }[] } | undefined;
      setError(signUpErr?.errors?.[0]?.message || "Sign up failed. Please try again.");
      triggerErrorReaction(signUpErr?.errors?.[0]?.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !code) return;
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        triggerSuccessReaction("Account created! Let's choose your role.");
        navigate(rolePath(), { replace: true });
      } else {
        setError("Invalid verification code.");
        triggerErrorReaction("Invalid verification code.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      const verifyErr = err as { errors?: { message?: string }[] } | undefined;
      setError(verifyErr?.errors?.[0]?.message || "Verification failed.");
      triggerErrorReaction(verifyErr?.errors?.[0]?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      triggerSuccessReaction("We've sent a new code to your email.");
    } catch (err) {
      console.error("Resend code error:", err);
      const resendErr = err as { errors?: { message?: string }[] } | undefined;
      const msg = resendErr?.errors?.[0]?.message || "Couldn't resend the code. Please try again.";
      setError(msg);
      triggerErrorReaction(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-4">
      <SeoMeta title="Create Account" description="Create your free LoadSaathi account as a shipper or trucker." canonical="/register" robots="noindex, nofollow" />
      <div className="flex justify-between items-center max-w-6xl mx-auto w-full mb-8">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark size="h-9 w-9" />
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">LoadSaathi</span>
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center" data-avoid-disha>
        <div className="w-full max-w-sm animate-scale-in overflow-y-auto" data-avoid-disha>
          {verifying ? (
            <div className="space-y-4">
              <div className="text-center">
                <LogoMark size="h-14 w-14" className="mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify your email</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter the code sent to {email}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <input
                  type="text"
                  placeholder="Verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-0 outline-none transition-colors text-center text-lg tracking-widest"
                />
                <button
                  type="submit"
                  disabled={loading || !code}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verify"}
                </button>
              </form>

              <button
                onClick={handleResendCode}
                disabled={loading}
                className="w-full text-sm text-gray-500 hover:text-orange-600 font-medium flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Didn't get it? Resend code"}
              </button>

              <button
                onClick={() => { setVerifying(false); setError(""); }}
                className="w-full text-sm text-gray-500 hover:text-orange-600 font-medium flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign up
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <LogoMark size="h-14 w-14" className="mx-auto mb-4" />
                <img
                  src="/illustrations/handshake.png"
                  alt=""
                  draggable={false}
                  loading="lazy"
                  className="h-24 w-24 object-contain mx-auto mb-2 animate-float"
                />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join LoadSaathi as a shipper or trucker</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                onClick={handleGoogleSignUp}
                disabled={loading || !isLoaded}
                data-guide="oauth-google"
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-gray-400">or sign up with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignUp} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    name="fullName"
                    data-guide="full-name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-0 outline-none transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-0 outline-none transition-colors"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-guide="email"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-0 outline-none transition-colors"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    data-guide="password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-0 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  data-guide="submit"
                  onClick={() => guideHandleClick('[data-guide="submit"]')}
                  disabled={loading || !isLoaded || !firstName || !email || !password}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Create Account"}
                </button>
              </form>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-orange-600 dark:text-orange-400 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
