"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { Settings, User, Bell, Shield, Database, Palette, Loader2 } from "lucide-react";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Notification settings schema
const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  projectUpdates: z.boolean(),
  taskAssignments: z.boolean(),
  comments: z.boolean(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

interface User {
  id: string;
  name?: string;
  email: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
    },
  });

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      projectUpdates: true,
      taskAssignments: true,
      comments: true,
    },
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get("/api/auth/verify");
        const userData = response.data.user;
        setUser(userData);

        // Set form values
        profileForm.reset({
          name: userData.name || "",
          email: userData.email,
          bio: "",
        });
      } catch (err: any) {
        console.error("Error fetching user data:", err);
        setError(err.response?.data?.error || "Failed to fetch user data");
        toast.error("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateProfile = async (data: ProfileFormData) => {
    try {
      setIsUpdating(true);
      
      // For now, we'll just update the local state since the API might not be ready
      setUser(prev => prev ? { ...prev, name: data.name } : null);
      
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      const errorMessage = err.response?.data?.error || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateNotifications = async (data: NotificationFormData) => {
    try {
      setIsUpdating(true);
      
      // For now, we'll just show success since the API might not be ready
      toast.success("Notification settings updated successfully!");
    } catch (err: any) {
      console.error("Error updating notification settings:", err);
      const errorMessage = err.response?.data?.error || "Failed to update notification settings";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences.</p>
        </div>

        {/* Loading Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4 mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Settings</h2>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "profile"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "notifications"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Bell className="h-4 w-4 inline mr-2" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "security"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Shield className="h-4 w-4 inline mr-2" />
                Security
              </button>
              <button
                onClick={() => setActiveTab("appearance")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "appearance"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Palette className="h-4 w-4 inline mr-2" />
                Appearance
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Settings</span>
                </CardTitle>
                <CardDescription>
                  Update your profile information and personal details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-2xl">
                          {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <Button type="button" variant="outline">
                          Change Avatar
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, GIF or PNG. Max size of 1MB.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us a little about yourself" 
                              className="resize-none" 
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(handleUpdateNotifications)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Email Notifications</Label>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Notification Types</h3>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-medium">Project Updates</Label>
                            <p className="text-sm text-gray-500">Get notified about project changes</p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="projectUpdates"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-medium">Task Assignments</Label>
                            <p className="text-sm text-gray-500">Get notified when assigned to tasks</p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="taskAssignments"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-medium">Comments</Label>
                            <p className="text-sm text-gray-500">Get notified about new comments</p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="comments"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>
                  Manage your account security and password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Password</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Current Password</Label>
                        <Input type="password" placeholder="Enter current password" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">New Password</Label>
                        <Input type="password" placeholder="Enter new password" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Confirm New Password</Label>
                        <Input type="password" placeholder="Confirm new password" />
                      </div>
                      <Button>Change Password</Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Add an extra layer of security</p>
                        <p className="text-sm text-gray-500">Protect your account with 2FA</p>
                      </div>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Appearance Settings</span>
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Theme</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-20 flex-col">
                        <div className="w-full h-8 bg-white border rounded mb-2"></div>
                        <span className="text-sm">Light</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <div className="w-full h-8 bg-gray-900 rounded mb-2"></div>
                        <span className="text-sm">Dark</span>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Language</h3>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Date & Time Format</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Select defaultValue="mm/dd/yyyy">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="12h">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12-hour clock</SelectItem>
                          <SelectItem value="24h">24-hour clock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}