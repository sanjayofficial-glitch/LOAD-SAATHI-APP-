import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { Mail, ArrowLeft, Loader2, CheckCircle, Lock } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        showError(error.message || 'Failed to send reset email');
      } else {
        setSubmitted(true);
        showSuccess('Password reset email sent! Check your inbox.');
      }
    } catch {
      showError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 animate-scale-in">
          <div className="text-center">
            <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check Your Email</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your inbox and follow the instructions.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
          <div className="space-y-4 mt-8">
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="w-full border-gray-200 dark:border-gray-700"
            >
              Try a different email
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-md"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 animate-scale-in">
        <div className="text-center">
          <div className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password?</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input 
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 border-orange-100 dark:border-orange-800"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter the email associated with your account
            </p>
          </div>

          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 h-11 font-bold shadow-md"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link 
            to="/login" 
            className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
