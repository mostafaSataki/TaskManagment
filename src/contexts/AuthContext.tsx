"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: string;
  name?: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // Only run verification after component has mounted
    if (!hasMounted) return;

    const verifySession = async () => {
      try {
        console.log("AuthContext: Verifying session...");
        
        // Try to get user info from the new header-based endpoint first
        const response = await axios.get("/api/auth/user", {
          timeout: 3000,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log("AuthContext: User found from headers:", response.data.user);
        setUser(response.data.user);
        
      } catch (headerError) {
        console.log("AuthContext: Header-based auth failed, trying token verification...");
        
        // Fallback to token verification
        try {
          const fallbackResponse = await axios.get("/api/auth/verify", {
            timeout: 3000,
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          console.log("AuthContext: User found from token verification:", fallbackResponse.data.user);
          setUser(fallbackResponse.data.user);
          
        } catch (tokenError) {
          console.log("AuthContext: Both auth methods failed");
          setUser(null);
        }
      } finally {
        console.log("AuthContext: Setting isLoading to false");
        setIsLoading(false);
      }
    };

    verifySession();
  }, [hasMounted]);

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}