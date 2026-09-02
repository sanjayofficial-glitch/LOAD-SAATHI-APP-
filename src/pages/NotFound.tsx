
import { Link, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="text-center max-w-md animate-scale-in">
        <div className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Truck className="h-10 w-10 text-orange-600 dark:text-orange-400" />
        </div>
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
