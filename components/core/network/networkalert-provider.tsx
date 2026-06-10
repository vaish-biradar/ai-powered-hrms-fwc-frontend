
"use client"
import React, { createContext, useContext, ReactNode } from 'react';
import NetworkAlert from '@/components/core/network/network-alert';

interface NetworkAlertContextType {
  showNetworkAlert: (message?: string, type?: 'online' | 'offline') => void;
}

const NetworkAlertContext = createContext<NetworkAlertContextType | undefined>(undefined);

export const NetworkAlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = React.useState<{
    show: boolean;
    message?: string;
    type?: 'online' | 'offline';
  }>({
    show: false,
  });

  const showNetworkAlert = (
    message?: string, 
    type: 'online' | 'offline' = 'offline'
  ) => {
    setAlertState({
      show: true,
      message,
      type
    });
  };

  return (
    <NetworkAlertContext.Provider value={{ showNetworkAlert }}>
      {children}
      <NetworkAlert 
        offlineMessage={alertState.type === 'offline' ? alertState.message : undefined}
        reconnectMessage={alertState.type === 'online' ? alertState.message : undefined}
      />
    </NetworkAlertContext.Provider>
  );
};

// Custom hook to use the network alert context
export const useNetworkAlert = () => {
  const context = useContext(NetworkAlertContext);
  if (context === undefined) {
    throw new Error('useNetworkAlert must be used within a NetworkAlertProvider');
  }
  return context;
};