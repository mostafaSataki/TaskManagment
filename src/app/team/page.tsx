"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { Plus, Users, Search, Mail, Phone, Calendar, Loader2 } from "lucide-react";

// Team member form schema
const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.string().min(1, "Role is required"),
  workspaceId: z.string().min(1, "Workspace is required"),
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceId: string;
  createdAt: string;
  workspace?: {
    id: string;
    title: string;
  };
}

interface Workspace {
  id: string;
  title: string;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      workspaceId: "",
    },
  });

  // Fetch team members and workspaces
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch workspaces
        const workspacesResponse = await axios.get("/api/workspaces");
        setWorkspaces(workspacesResponse.data);

        // For now, we'll use mock team members since the API might not be ready
        const mockTeamMembers: TeamMember[] = [
          {
            id: "1",
            name: "John Doe",
            email: "john.doe@example.com",
            role: "Admin",
            workspaceId: workspacesResponse.data[0]?.id || "1",
            createdAt: new Date().toISOString(),
            workspace: workspacesResponse.data[0],
          },
          {
            id: "2", 
            name: "Jane Smith",
            email: "jane.smith@example.com",
            role: "Member",
            workspaceId: workspacesResponse.data[0]?.id || "1",
            createdAt: new Date().toISOString(),
            workspace: workspacesResponse.data[0],
          },
        ];
        
        setTeamMembers(mockTeamMembers);
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

  const handleAddTeamMember = async (data: TeamMemberFormData) => {
    try {
      setIsCreating(true);
      
      // For now, we'll just add to the local state since the API might not be ready
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        role: data.role,
        workspaceId: data.workspaceId,
        createdAt: new Date().toISOString(),
        workspace: workspaces.find(w => w.id === data.workspaceId),
      };
      
      setTeamMembers(prev => [newMember, ...prev]);
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      form.reset();
      toast.success("Team member added successfully!");
    } catch (err: any) {
      console.error("Error adding team member:", err);
      const errorMessage = err.response?.data?.error || "Failed to add team member";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter team members based on search term
  const filteredMembers = teamMembers.filter(member => {
    return member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           member.role.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team</h1>
            <p className="text-gray-600">Manage your team members and their roles.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Loading Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mt-2"></div>
                  </div>
                </div>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Team</h2>
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
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600">Manage your team members and their roles.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a new member to your team.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddTeamMember)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Member">Member</SelectItem>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
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
                        Adding...
                      </>
                    ) : (
                      "Add Member"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search team members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Team Members Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <Badge variant="secondary">
            {filteredMembers.length} {filteredMembers.length === 1 ? "Member" : "Members"}
          </Badge>
        </div>

        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members Found</h3>
              <p className="text-gray-600 text-center mb-4">
                {searchTerm 
                  ? "No team members match your search criteria." 
                  : "Add your first team member to get started."
                }
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Member
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="h-full">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={`/api/placeholder/avatar/${member.id}`} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{member.email}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Role</span>
                      <Badge variant={member.role === "Admin" ? "default" : "secondary"}>
                        {member.role}
                      </Badge>
                    </div>
                    
                    {member.workspace && (
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Workspace</span>
                        <span>{member.workspace.title}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined</span>
                      </div>
                      <span>{new Date(member.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}