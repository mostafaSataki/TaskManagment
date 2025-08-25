"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: string;
  name?: string;
  email: string;
}

export default function TestDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("/api/auth/verify");
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not Authenticated</h2>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-800">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Test Dashboard (No Protected Layout)
            </h1>
            <p className="text-gray-600 mb-4">
              Welcome! This is a simple test dashboard that bypasses the protected layout.
            </p>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <strong>Authentication Successful!</strong>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold mb-2">User Information:</h3>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.name || "N/A"}</p>
            </div>
            <div className="mt-4">
              <a href="/login" className="text-blue-600 hover:text-blue-800 mr-4">Back to Login</a>
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800">Try Real Dashboard</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}