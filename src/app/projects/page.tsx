"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { Plus, FolderOpen, Users, Calendar, Search, Filter, Loader2 } from "lucide-react";

// Project form schema
const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().optional(),
  workspaceId: z.string().min(1, "Workspace is required"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Project {
  id: string;
  title: string;
  description?: string;
  workspaceId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  workspace?: {
    id: string;
    title: string;
  };
  _count?: {
    tasks: number;
  };
}

interface Workspace {
  id: string;
  title: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      workspaceId: "",
    },
  });

  // Fetch projects and workspaces
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch workspaces
        const workspacesResponse = await axios.get("/api/workspaces");
        setWorkspaces(workspacesResponse.data);

        // Fetch projects from all workspaces
        const allProjects: Project[] = [];
        for (const workspace of workspacesResponse.data) {
          try {
            const projectsResponse = await axios.get(`/api/workspaces/${workspace.id}/projects`);
            allProjects.push(...projectsResponse.data);
          } catch (err) {
            console.error(`Error fetching projects for workspace ${workspace.id}:`, err);
          }
        }
        
        setProjects(allProjects);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.error || "Failed to fetch data");
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      setIsCreating(true);
      const response = await axios.post(`/api/workspaces/${data.workspaceId}/projects`, {
        title: data.title,
        description: data.description,
      });
      
      // Add new project to the list
      setProjects(prev => [response.data, ...prev]);
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      form.reset();
      toast.success("Project created successfully!");
    } catch (err: any) {
      console.error("Error creating project:", err);
      const errorMessage = err.response?.data?.error || "Failed to create project";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter projects based on search term and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600">Manage your projects across all workspaces.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Loading Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
        <div className="text-red-500 mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Projects</h2>
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
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your projects across all workspaces.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project in one of your workspaces.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateProject)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project title" {...field} />
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
                          placeholder="Enter project description" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workspaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a workspace" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workspaces.map((workspace) => (
                            <SelectItem key={workspace.id} value={workspace.id}>
                              {workspace.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      "Create Project"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">All Projects</h2>
          <Badge variant="secondary">
            {filteredProjects.length} {filteredProjects.length === 1 ? "Project" : "Projects"}
          </Badge>
        </div>

        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
              <p className="text-gray-600 text-center mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "No projects match your search criteria." 
                  : "Create your first project to get started."
                }
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FolderOpen className="h-5 w-5 text-green-500" />
                      <span>{project.title}</span>
                    </CardTitle>
                    <CardDescription>
                      {project.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {project.workspace && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Workspace:</span> {project.workspace.title}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="outline">
                          {project._count?.tasks || 0} {project._count?.tasks === 1 ? "Task" : "Tasks"}
                        </Badge>
                      </div>
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