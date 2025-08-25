"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { Plus, FolderOpen, Users, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

// Workspace form schema
const workspaceSchema = z.object({
  title: z.string().min(1, "Workspace title is required"),
  description: z.string().optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

interface Workspace {
  id: string;
  title: string;
  description?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    projects: number;
    users: number;
  };
}

interface DashboardStats {
  totalWorkspaces: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export default function MainDashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkspaces: 0,
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Fetch workspaces and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch workspaces
        const workspacesResponse = await axios.get("/api/workspaces");
        const workspacesData = workspacesResponse.data;
        setWorkspaces(workspacesData);

        // Calculate stats
        let totalProjects = 0;
        let allTasks: any[] = [];
        
        for (const workspace of workspacesData) {
          const projectsResponse = await axios.get(`/api/workspaces/${workspace.id}/projects`);
          const projects = projectsResponse.data;
          totalProjects += projects.length;

          // Fetch tasks for each project
          for (const project of projects) {
            const tasksResponse = await axios.get(`/api/projects/${project.id}/tasks`);
            const tasks = tasksResponse.data;
            allTasks = [...allTasks, ...tasks];
          }
        }

        const completedTasks = allTasks.filter(task => task.status === "done").length;
        const pendingTasks = allTasks.filter(task => task.status !== "done").length;

        setStats({
          totalWorkspaces: workspacesData.length,
          totalProjects,
          totalTasks: allTasks.length,
          completedTasks,
          pendingTasks,
        });
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.response?.data?.error || "Failed to fetch data");
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateWorkspace = async (data: WorkspaceFormData) => {
    try {
      setIsCreating(true);
      const response = await axios.post("/api/workspaces", data);
      
      // Add new workspace to the list
      setWorkspaces(prev => [response.data, ...prev]);
      setStats(prev => ({ ...prev, totalWorkspaces: prev.totalWorkspaces + 1 }));
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      form.reset();
      toast.success("Workspace created successfully!");
    } catch (err: any) {
      console.error("Error creating workspace:", err);
      const errorMessage = err.response?.data?.error || "Failed to create workspace";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Main Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your projects.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Create a new workspace to organize your projects and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateWorkspace)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter workspace title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter workspace description" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Workspace"
                      )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Workspaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Main Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/login">
            <Button variant="outline">
              Logout
            </Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Create a new workspace to organize your projects and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateWorkspace)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter workspace title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter workspace description" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Workspace"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkspaces}</div>
            <p className="text-xs text-muted-foreground">
              Active workspaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tasks in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workspaces Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Workspaces</h2>
          <Badge variant="secondary">
            {workspaces.length} {workspaces.length === 1 ? "Workspace" : "Workspaces"}
          </Badge>
        </div>

        {workspaces.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Workspaces Yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Create your first workspace to start organizing your projects and collaborating with your team.
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Workspace
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Link key={workspace.id} href={`/workspace/${workspace.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FolderOpen className="h-5 w-5 text-blue-500" />
                      <span>{workspace.title}</span>
                    </CardTitle>
                    <CardDescription>
                      {workspace.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
                      <Badge variant="outline">
                        {workspace._count?.projects || 0} {workspace._count?.projects === 1 ? "Project" : "Projects"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}