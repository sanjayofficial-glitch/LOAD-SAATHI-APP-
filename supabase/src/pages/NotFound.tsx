
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoMeta from '@/components/SeoMeta';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <SeoMeta title="Page Not Found" description="The page you are looking for does not exist." robots="noindex, nofollow" />
      <div className="text-center max-w-md animate-scale-in">
        <img
          src="/illustrations/question-mark.png"
          alt=""
          draggable={false}
          loading="lazy"
          className="h-40 w-40 object-contain mx-auto mb-2 animate-float"
        />
        <h1 className="text-7xl sm:text-8xl font-black bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent mb-2">404</h1>
        <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Page not found</p>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-md px-6">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Button variant="outline" className="border-gray-200 dark:border-gray-700" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
        
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-8">
          Use the buttons above to navigate
        </p>
      </div>
    </div>
  );
};

export default NotFound;
