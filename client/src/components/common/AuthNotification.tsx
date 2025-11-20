import { useState, useEffect } from 'react';

interface AuthNotificationProps {
  onClose: () => void;
}

export default function AuthNotification({ onClose }: AuthNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Session Expired
            </h3>
            <div className="mt-1 text-sm text-red-700">
              Your login session has expired. Please log in again to continue.
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50 rounded-md"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

