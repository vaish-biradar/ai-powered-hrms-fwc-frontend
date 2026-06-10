// useToast.ts
import { toast, Toaster } from 'sonner';
import { cn } from '@/lib/utils'; // Assuming you have the cn utility from shadcn
import React from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react";

// Toast variants
type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

// Toast position
type ToastPosition = 
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

// Options that can be passed as the second parameter
interface ToastDescriptionOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

interface ToastOptions {
  position?: ToastPosition;
  closeButton?: boolean;
  theme?: 'light' | 'dark' | 'system';
  richColors?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Default toast options
const defaultOptions: ToastOptions = {
  position: 'bottom-right',
  closeButton: true,
  theme: 'system',
  richColors: true,
  className: 'font-sans', // Match your shadcn font
};

// Helper to get variant-specific styling
const getVariantStyling = (variant: ToastVariant) => {
  switch (variant) {
    case 'success':
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />,
        className: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      };
    case 'error':
      return {
        icon: <X className="h-5 w-5 text-red-600 dark:text-red-500" />,
        className: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      };
    case 'warning':
      return {
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />,
        className: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      };
    case 'info':
      return {
        icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-500" />,
        className: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      };
    default:
      return {
        icon: <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
        className: 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700',
      };
  }
};

/**
 * Custom hook for using toast notifications
 */
export function useToast(customOptions?: ToastOptions) {
  const options = { ...defaultOptions, ...customOptions };

  const showToast = (title: string, { description, duration = 5000, action, onDismiss, icon }: ToastDescriptionOptions = {}, variant: ToastVariant = 'default') => {
    const variantStyling = getVariantStyling(variant);
    
    return toast(title, {
      description,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      onDismiss,
      icon: icon || variantStyling.icon,
      className: cn(
        'rounded-md border p-4',
        'shadow-lg',
        variantStyling.className
      ),
    });
  };

  // Create toast object with methods
  const toastMethods = {
    // Base toast method
    toast: (title: string, options?: ToastDescriptionOptions) => showToast(title, options, 'default'),
    
    // Variant-specific methods
    success: (title: string, options?: ToastDescriptionOptions) => showToast(title, options, 'success'),
    error: (title: string, options?: ToastDescriptionOptions) => showToast(title, options, 'error'),
    warning: (title: string, options?: ToastDescriptionOptions) => showToast(title, options, 'warning'),
    info: (title: string, options?: ToastDescriptionOptions) => showToast(title, options, 'info'),
    
    // Additional utility methods
    dismiss: toast.dismiss,
    options
  };

  return toastMethods;
}

/**
 * Toast Provider Component
 */
export function ToastProvider({ 
  position = defaultOptions.position,
  closeButton = defaultOptions.closeButton,
  theme = defaultOptions.theme, 
  richColors = defaultOptions.richColors, 
  className,
  style,
}: ToastOptions) {
  return (
    <Toaster
      position={position}
      closeButton={closeButton}
      theme={theme}
      richColors={richColors}
      className={cn(
        'font-sans',
        className
      )}
      style={style}
      toastOptions={{
        classNames: {
          title: 'text-sm font-medium text-foreground',
          description: 'text-xs text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground hover:bg-primary/90 text-xs',
          cancelButton: 'bg-muted text-muted-foreground hover:bg-muted/90 text-xs',
          toast: 'group flex w-full items-center border rounded-md shadow-lg',
        }
      }}
    />
  );
}