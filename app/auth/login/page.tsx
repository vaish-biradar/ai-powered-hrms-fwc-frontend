"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAzureSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("azure-ad", { 
        redirect: false,
      });
      
      if (result?.error) {
        setError(result.error);
      }
    } catch (error) {
      console.error("Azure AD Sign-in failed:", error);
      setError("Authentication failed. Please contact your IT support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen max-w-7xl pt-10 mx-auto ">
      {/* Left Side - Vector Image */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-primary-50">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-2">
            <Image
              src="/assets/login1.svg" 
              alt="Azure AD SSO Illustration" 
              height={250}
              width={400}
              className="max-w-full h-auto object-contain"
            />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-primary-800">
            Secure Single Sign-On
          </h2>
          <p className="text-muted-foreground mt-4 text-sm lg:text-base">
            Streamlined access with Microsoft Azure Active Directory authentication
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 lg:p-16 border shadow-sm rounded-md">
          <div className="mb-8 text-center">
            <Shield className="mx-auto h-12 w-12 lg:h-16 lg:w-16 text-primary mb-4" />
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Azure AD Single Sign-On
            </h1>
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              Securely access your organizational resources
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Button 
              onClick={handleAzureSignIn} 
              disabled={loading} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-300 flex items-center justify-center"
            >
              <svg 
                className="w-5 h-5 lg:w-6 lg:h-6 mr-2" 
                viewBox="0 0 21 21" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M1 1h9v9H1z" fill="#f25022" />
                <path d="M1 11h9v9H1z" fill="#00a4ef" />
                <path d="M11 1h9v9h-9z" fill="#7fba00" />
                <path d="M11 11h9v9h-9z" fill="#ffb900" />
              </svg>
              {loading ? "Authenticating..." : "Sign in with Azure AD"}
            </Button>

         
            <div className="text-center text-xs lg:text-sm text-muted-foreground mt-6">
              <p>© {new Date().getFullYear()} FWC. All rights reserved.</p>
              <div className="mt-2 space-x-2">
                <a href="#" className="hover:underline">Support</a>
                <span>|</span>
                <a href="#" className="hover:underline">Help</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}