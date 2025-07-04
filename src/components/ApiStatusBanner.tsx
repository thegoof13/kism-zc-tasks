import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, WifiOff, X } from 'lucide-react';
import { ApiService } from '../services/api';

interface ApiStatusBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function ApiStatusBanner({ isVisible, onDismiss }: ApiStatusBannerProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white shadow-lg animate-slide-down">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 animate-pulse" />
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">
                Server Connection Lost
              </p>
              <p className="text-xs opacity-90">
                Your changes may not be saved. Check your internet connection.
              </p>
            </div>
          </div>
          
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-red-600 transition-colors duration-200"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function useApiStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  const checkApiStatus = async () => {
    try {
      const isHealthy = await ApiService.checkHealth();
      const wasOffline = !isOnline;
      
      setIsOnline(isHealthy);
      setLastCheckTime(Date.now());
      
      if (!isHealthy) {
        setShowBanner(true);
      } else if (wasOffline && isHealthy) {
        // API came back online - briefly show success then hide
        setShowBanner(false);
      }
    } catch (error) {
      console.error('API health check failed:', error);
      setIsOnline(false);
      setShowBanner(true);
    }
  };

  useEffect(() => {
    // Initial check
    checkApiStatus();

    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);

    // Also check when window regains focus
    const handleFocus = () => {
      // Only check if it's been more than 10 seconds since last check
      if (Date.now() - lastCheckTime > 10000) {
        checkApiStatus();
      }
    };

    // Check when coming back online
    const handleOnline = () => {
      setTimeout(checkApiStatus, 1000); // Small delay to ensure connection is stable
    };

    // Immediately show banner when going offline
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lastCheckTime]);

  const dismissBanner = () => {
    setShowBanner(false);
  };

  return {
    isOnline,
    showBanner,
    dismissBanner,
    checkApiStatus,
  };
}