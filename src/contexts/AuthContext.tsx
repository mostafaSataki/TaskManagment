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

  useEffect(() => {
    // Verify user session on mount
    const verifySession = async () => {
      try {
        console.log("AuthContext: Verifying session...");
        const response = await axios.get("/api/auth/verify");
        console.log("AuthContext: Verify response:", response.data);
        if (response.data.user) {
          console.log("AuthContext: User found, setting user state:", response.data.user);
          setUser(response.data.user);
        } else {
          console.log("AuthContext: No user in response");
          setUser(null);
        }
      } catch (error) {
        console.log("AuthContext: Session verification failed:", error);
        // User is not authenticated, clear user state
        setUser(null);
      } finally {
        console.log("AuthContext: Setting isLoading to false");
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

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