"use client"

import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { WifiOff, Wifi } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface NetworkAlertProps {
  reconnectMessage?: string;
  offlineMessage?: string;
}

const NetworkAlert: React.FC<NetworkAlertProps> = ({
  reconnectMessage = "Your internet connection has been restored.",
  offlineMessage = "No internet connection. Please check your network."
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Handle online event
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(true);
      
      // Automatically hide success message after 3 seconds
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 3000);

      return () => clearTimeout(timer);
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If no alert should be shown, return null
  if (!showAlert) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-md">
      <Alert 
        variant={isOnline ? "default" : "destructive"}
        className="animate-in slide-in-from-right"
      >
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <AlertTitle>
          {isOnline ? "Connected" : "Offline"}
        </AlertTitle>
        <AlertDescription>
          {isOnline ? reconnectMessage : offlineMessage}
        </AlertDescription>
        {!isOnline && (
          <div className="mt-2 flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Attempt to reconnect or reload
                window.location.reload();
              }}
            >
              Retry Connection
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
};

export default NetworkAlert;