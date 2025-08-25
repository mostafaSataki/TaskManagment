"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                <img
                  src="/logo.svg"
                  alt="Z.ai Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Task Management
              <span className="text-blue-600"> Simplified</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Organize your work, collaborate with your team, and track progress with our intuitive task management platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Get Started
                </button>
              </Link>
              <Link href="/login">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Stay Productive
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed to help you and your team work better together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="h-8 w-8 text-blue-500">📁</div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Workspace Management</h3>
            <p className="text-muted-foreground">
              Create and manage multiple workspaces to organize your projects efficiently.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="h-8 w-8 text-green-500">👥</div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
            <p className="text-muted-foreground">
              Collaborate with your team members in real-time with shared projects and tasks.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="h-8 w-8 text-purple-500">✅</div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Task Tracking</h3>
            <p className="text-muted-foreground">
              Track tasks with drag-and-drop kanban boards and stay on top of your workflow.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams already using our platform to manage their work.
          </p>
          <Link href="/register">
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
              Create Your Account
            </button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-12 h-12">
              <img
                src="/logo.svg"
                alt="Z.ai Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <p className="text-gray-400">
            © 2024 Task Management Platform. Built with Next.js and Z.ai.
          </p>
        </div>
      </footer>
    </div>
  );
}