"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/better-auth/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface GoogleSignInButtonProps {
  mode: "signin" | "signup";
  callbackURL?: string;
}

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.8-.1-1.1H12Z"
    />
    <path
      fill="#34A853"
      d="M2.4 7.3l3.2 2.4C6.5 8 9 6 12 6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4c-3.7 0-6.9 2.1-8.6 4.9Z"
    />
    <path
      fill="#FBBC05"
      d="M12 21.6c2.6 0 4.8-.9 6.4-2.4l-3-2.4c-.8.6-1.9 1.1-3.4 1.1-3.9 0-5.2-2.6-5.5-3.9l-3.2 2.5c1.7 3 4.9 5.1 8.7 5.1Z"
    />
    <path
      fill="#4285F4"
      d="M21.6 12.1c0-.7-.1-1.2-.2-1.8H12v3.9h5.5c-.3 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6 0-.8.2-1.6.5-2.3L3.3 7.2A9.5 9.5 0 0 0 2.4 12c0 5.3 4.3 9.6 9.6 9.6 5.5 0 9.1-3.9 9.1-9.5Z"
    />
  </svg>
);

const GoogleSignInButton = ({
  mode,
  callbackURL = "/",
}: GoogleSignInButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });

      if (result?.error) {
        toast.error("Google authentication failed", {
          description: result.error.message || "Please try again.",
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("Google authentication failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to start Google sign-in.",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      variant="outline"
      className="w-full border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700"
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        <>
          <GoogleIcon />
          {mode === "signin" ? "Continue with Google" : "Sign up with Google"}
        </>
      )}
    </Button>
  );
};

export default GoogleSignInButton;
