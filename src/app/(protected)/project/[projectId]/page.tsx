"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  MoreHorizontal,
  MessageCircle,
  GripVertical,
  User,
  CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskForm } from "@/components/task-management/TaskForm";

// Comment form schema
const commentSchema = z.object({
  body: z.string().min(1, "Comment is required"),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface Task {
  id: string;
  description: string;
  projectId: string;
  createdById: string;
  assignedToId?: string;
  status: number;
  priority: number;
  importanceType?: number;
  startDateTime?: string;
  endDateTime?: string;
  timeEstimateDay?: number;
  timeEstimateHour?: number;
  timeEstimateMinute?: number;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    name?: string;
    email: string;
  };
  createdBy: {
    id: string;
    name?: string;
    email: string;
  };
  comments?: Comment[];
  assignees?: {
    userId: string;
    name?: string;
    email: string;
    status: number;
    assignedAt: string;
  }[];
}

interface Comment {
  id: string;
  taskId: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

interface User {
  id: string;
  name?: string;
  email: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  workSpaceId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

// Sortable Task Card Component
function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return "bg-red-100 text-red-800 border-red-200";
      case 2: return "bg-orange-100 text-orange-800 border-orange-200";
      case 1: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 0: return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return "Critical";
      case 2: return "High";
      case 1: return "Medium";
      case 0: return "Low";
      default: return "Medium";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return "border-gray-300 bg-gray-50";
      case 1: return "border-blue-300 bg-blue-50";
      case 2: return "border-green-300 bg-green-50";
      default: return "border-gray-300 bg-gray-50";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-3 cursor-pointer hover:shadow-md transition-shadow",
        isDragging && "opacity-50 shadow-lg"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <h4 className="font-medium text-sm text-gray-900 flex-1">{task.description}</h4>
          </div>
          <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>
        
        {task.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {task.assignedTo && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{task.assignedTo.name || task.assignedTo.email}</span>
              </div>
            )}
            {task.endDateTime && (
              <div className="flex items-center space-x-1">
                <CalendarDays className="h-3 w-3" />
                <span>{new Date(task.endDateTime).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-3 w-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Column Component
function Column({ column, onAddTask, onTaskClick }: { 
  column: Column; 
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo": return "border-gray-300 bg-gray-50";
      case "in-progress": return "border-blue-300 bg-blue-50";
      case "done": return "border-green-300 bg-green-50";
      default: return "border-gray-300 bg-gray-50";
    }
  };

  return (
    <div className="flex-1 min-w-80 bg-white rounded-lg border border-gray-200">
      <div className={cn(
        "p-4 border-b",
        getStatusColor(column.id)
      )}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <Badge variant="outline">{column.tasks.length}</Badge>
        </div>
        {column.id === "0" && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-gray-600 hover:text-gray-900"
            onClick={onAddTask}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>
      
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        <SortableContext items={column.tasks.map(task => task.id)}>
          {column.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
  const [columns, setColumns] = useState<Record<string, Column>>({
    "0": { id: "0", title: "To Do", tasks: [] },
    "1": { id: "1", title: "In Progress", tasks: [] },
    "2": { id: "2", title: "Done", tasks: [] },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const commentForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      body: "",
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch project and tasks data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch project details
        const projectResponse = await axios.get(`/api/projects/${projectId}`);
        setProject(projectResponse.data);

        // Fetch workspace users for assignee selection
        if (projectResponse.data.workSpaceId) {
          try {
            const usersResponse = await axios.get(`/api/workspaces/${projectResponse.data.workSpaceId}/users`);
            setWorkspaceUsers(usersResponse.data);
          } catch (err) {
            console.log("Could not fetch workspace users:", err);
            setWorkspaceUsers([]);
          }
        }

        // Fetch tasks for this project
        const tasksResponse = await axios.get(`/api/projects/${projectId}/tasks`);
        const tasks = tasksResponse.data;

        // Group tasks by status (0: todo, 1: in-progress, 2: done)
        const groupedTasks = {
          "0": { id: "0", title: "To Do", tasks: tasks.filter((t: Task) => t.status === 0) },
          "1": { id: "1", title: "In Progress", tasks: tasks.filter((t: Task) => t.status === 1) },
          "2": { id: "2", title: "Done", tasks: tasks.filter((t: Task) => t.status === 2) },
        };

        setColumns(groupedTasks);
      } catch (err: any) {
        console.error("Error fetching project data:", err);
        setError(err.response?.data?.error || "Failed to fetch project data");
        toast.error("Failed to load project data");
        
        // If project not found, redirect to dashboard
        if (err.response?.status === 404) {
          router.push("/dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchData();
    }
  }, [projectId, router]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Find the active task
    for (const column of Object.values(columns)) {
      const task = column.tasks.find(t => t.id === active.id);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the source and destination columns
    let sourceColumn: Column | null = null;
    let destinationColumn: Column | null = null;

    for (const column of Object.values(columns)) {
      if (column.tasks.some(t => t.id === activeId)) {
        sourceColumn = column;
      }
      if (column.id === overId || column.tasks.some(t => t.id === overId)) {
        destinationColumn = column;
      }
    }

    if (!sourceColumn || !destinationColumn || sourceColumn.id === destinationColumn.id) {
      return;
    }

    // Move task between columns
    const activeTask = sourceColumn.tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Update local state
    const newColumns = { ...columns };
    newColumns[sourceColumn.id] = {
      ...sourceColumn,
      tasks: sourceColumn.tasks.filter(t => t.id !== activeId),
    };
    newColumns[destinationColumn.id] = {
      ...destinationColumn,
      tasks: [...destinationColumn.tasks, { ...activeTask, status: destinationColumn.id }],
    };

    setColumns(newColumns);

    // Update task status in backend
    try {
      await axios.patch(`/api/tasks/${activeId}/status`, {
        status: parseInt(destinationColumn.id),
      });
      toast.success("Task status updated successfully!");
    } catch (err: any) {
      console.error("Error updating task status:", err);
      toast.error("Failed to update task status");
      // Revert the change on error
      setColumns(columns);
    }

    setActiveTask(null);
  };

  const handleAddComment = async (data: CommentFormData) => {
    if (!selectedTask) return;

    try {
      setIsCommenting(true);
      
      const response = await axios.post(`/api/tasks/${selectedTask.id}/comments`, data);
      
      // Update the selected task with new comment
      setSelectedTask(prev => ({
        ...prev!,
        comments: [...(prev?.comments || []), response.data],
      }));
      
      // Update the task in the columns
      setColumns(prev => {
        const newColumns = { ...prev };
        for (const [key, column] of Object.entries(newColumns)) {
          const taskIndex = column.tasks.findIndex(t => t.id === selectedTask.id);
          if (taskIndex !== -1) {
            newColumns[key] = {
              ...column,
              tasks: column.tasks.map((t, index) => 
                index === taskIndex 
                  ? { ...t, comments: [...(t.comments || []), response.data] }
                  : t
              ),
            };
            break;
          }
        }
        return newColumns;
      });
      
      // Reset comment form
      commentForm.reset();
      toast.success("Comment added successfully!");
    } catch (err: any) {
      console.error("Error adding comment:", err);
      const errorMessage = err.response?.data?.error || "Failed to add comment";
      toast.error(errorMessage);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mt-1"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-24 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="bg-gray-50 rounded border border-gray-200 p-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Project</h2>
        <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
        <Button onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-600">
              {project.description || "No description provided"}
            </p>
          </div>
        </div>
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
        </Dialog>
        
        {/* Task Form Component */}
        {project && (
          <TaskForm
            open={isTaskDialogOpen}
            onOpenChange={setIsTaskDialogOpen}
            projectId={projectId}
            workspaceId={project.workSpaceId}
            users={workspaceUsers}
            onSuccess={() => {
              // Refresh tasks after creation
              const fetchData = async () => {
                try {
                  const tasksResponse = await axios.get(`/api/projects/${projectId}/tasks`);
                  const tasks = tasksResponse.data;
                  
                  const groupedTasks = {
                    "0": { id: "0", title: "To Do", tasks: tasks.filter((t: Task) => t.status === 0) },
                    "1": { id: "1", title: "In Progress", tasks: tasks.filter((t: Task) => t.status === 1) },
                    "2": { id: "2", title: "Done", tasks: tasks.filter((t: Task) => t.status === 2) },
                  };
                  
                  setColumns(groupedTasks);
                } catch (err) {
                  console.error("Error refreshing tasks:", err);
                }
              };
              fetchData();
            }}
          />
        )}
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(columns).map((column) => (
            <Column
              key={column.id}
              column={column}
              onAddTask={() => setIsTaskDialogOpen(true)}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <Card className="opacity-50 shadow-lg">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm text-gray-900 mb-2">
                  {activeTask.description}
                </h4>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View task details and add comments
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              {/* Task Information */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedTask.description || "No description provided"}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <Badge className={cn("mt-1", 
                      selectedTask.status === 0 ? "bg-gray-100 text-gray-800" :
                      selectedTask.status === 1 ? "bg-blue-100 text-blue-800" :
                      "bg-green-100 text-green-800"
                    )}>
                      {selectedTask.status === 0 ? "To Do" :
                       selectedTask.status === 1 ? "In Progress" :
                       "Done"}
                    </Badge>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Priority</Label>
                    <Badge className={cn("mt-1",
                      selectedTask.priority === 3 ? "bg-red-100 text-red-800" :
                      selectedTask.priority === 2 ? "bg-orange-100 text-orange-800" :
                      selectedTask.priority === 1 ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    )}>
                      {getPriorityLabel(selectedTask.priority)}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Created By</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTask.createdBy.name || selectedTask.createdBy.email}
                    </p>
                  </div>
                  
                  {selectedTask.assignedTo && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Assigned To</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedTask.assignedTo.name || selectedTask.assignedTo.email}
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedTask.endDateTime && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Due Date</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(selectedTask.endDateTime)}
                    </p>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Comments</Label>
                <div className="mt-3 space-y-3 max-h-48 overflow-y-auto">
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.user.name || comment.user.email}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{comment.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No comments yet
                    </p>
                  )}
                </div>
                
                {/* Add Comment Form */}
                <Form {...commentForm}>
                  <form onSubmit={commentForm.handleSubmit(handleAddComment)} className="mt-4 space-y-3">
                    <FormField
                      control={commentForm.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Add Comment</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Write a comment..." 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isCommenting} size="sm">
                      {isCommenting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post Comment"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}