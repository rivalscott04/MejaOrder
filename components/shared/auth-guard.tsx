"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type LoginResponse } from "@/lib/api-client";
import { LoginRequiredModal } from "./login-required-modal";

type AuthGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          setShowModal(false);
        } else {
          setIsAuthenticated(false);
          setShowModal(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setShowModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
            <p className="text-sm text-slate-600">Memeriksa autentikasi...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {fallback || (
          <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
              <p className="text-slate-600">Memeriksa autentikasi...</p>
            </div>
          </div>
        )}
        <LoginRequiredModal isOpen={showModal} />
      </>
    );
  }

  return <>{children}</>;
}

