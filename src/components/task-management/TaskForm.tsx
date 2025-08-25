"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Users, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";

// Task form schema based on database structure
const taskSchema = z.object({
  description: z.string().min(1, "Task description is required"),
  startDateTime: z.date().optional(),
  endDateTime: z.date().optional(),
  timeEstimateDay: z.number().int().min(0).optional(),
  timeEstimateHour: z.number().int().min(0).max(23).optional(),
  timeEstimateMinute: z.number().int().min(0).max(59).optional(),
  priority: z.enum(["0", "1", "2", "3"]).optional(),
  importanceType: z.enum(["0", "1", "2"]).optional(),
  assignedToId: z.string().optional(),
}).refine((data) => {
  if (data.startDateTime && data.endDateTime) {
    return data.endDateTime >= data.startDateTime;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDateTime"],
});

type TaskFormData = z.infer<typeof taskSchema>;

interface User {
  id: string;
  name?: string;
  email: string;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  workspaceId: string;
  users: User[];
  onSuccess?: () => void;
}

export function TaskForm({ open, onOpenChange, projectId, workspaceId, users, onSuccess }: TaskFormProps) {
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      description: "",
      startDateTime: undefined,
      endDateTime: undefined,
      timeEstimateDay: 0,
      timeEstimateHour: 0,
      timeEstimateMinute: 0,
      priority: "1", // Medium priority by default
      importanceType: "1", // Medium importance by default
      assignedToId: undefined,
    },
  });

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      setIsCreating(true);
      
      const taskData = {
        ...data,
        startDateTime: data.startDateTime ? data.startDateTime.toISOString() : null,
        endDateTime: data.endDateTime ? data.endDateTime.toISOString() : null,
      };

      const response = await axios.post(`/api/projects/${projectId}/tasks`, taskData);
      
      // Close dialog and reset form
      onOpenChange(false);
      form.reset();
      toast.success("Task created successfully!");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Error creating task:", err);
      const errorMessage = err.response?.data?.error || "Failed to create task";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const priorityOptions = [
    { value: "0", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "1", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "2", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "3", label: "Critical", color: "bg-red-100 text-red-800" },
  ];

  const importanceOptions = [
    { value: "0", label: "Low", color: "bg-blue-100 text-blue-800" },
    { value: "1", label: "Medium", color: "bg-purple-100 text-purple-800" },
    { value: "2", label: "High", color: "bg-pink-100 text-pink-800" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task for this project. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateTask)} className="space-y-6">
            {/* Task Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter task description..."
                      className="min-h-[100px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority and Importance */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <Badge className={option.color}>
                                {option.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="importanceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importance</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select importance" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {importanceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <Badge className={option.color}>
                                {option.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues("startDateTime");
                            return startDate ? date < startDate : false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Time Estimate */}
            <div className="space-y-3">
              <FormLabel className="text-sm font-medium">Time Estimate (Optional)</FormLabel>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <FormField
                    control={form.control}
                    name="timeEstimateDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Days"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timeEstimateHour"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Hours"
                            min="0"
                            max="23"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timeEstimateMinute"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Minutes"
                            min="0"
                            max="59"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Assignee */}
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <Users className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}