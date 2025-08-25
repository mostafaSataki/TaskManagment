"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

function ProtectedLayoutContent({ children }: ProtectedLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    console.log("ProtectedLayout: Component mounted");
    setIsMounted(true);
  }, []);

  useEffect(() => {
    console.log("ProtectedLayout: Checking auth state:", { isMounted, isLoading, user });
    if (isMounted && !isLoading && !user) {
      console.log("ProtectedLayout: No user found, redirecting to login");
      router.push("/login");
    } else if (isMounted && !isLoading && user) {
      console.log("ProtectedLayout: User authenticated:", user);
    }
  }, [user, isLoading, isMounted, router]);

  // Show loading state while checking authentication
  if (!isMounted || isLoading) {
    console.log("ProtectedLayout: Showing loading state");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, don't render anything (redirect will happen)
  if (!user) {
    console.log("ProtectedLayout: No user, returning null");
    return null;
  }

  console.log("ProtectedLayout: Rendering protected content");
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header user={user} />
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <AuthProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </AuthProvider>
  );
}