"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

function ProtectedLayoutContent({ children }: ProtectedLayoutProps) {
  const { user, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading state while checking authentication
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, show a simple message (no redirect)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access this page.</p>
          <a href="/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // User is authenticated, render the protected content
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