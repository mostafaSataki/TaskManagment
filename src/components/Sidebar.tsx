"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/main-dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Workspaces",
    href: "/workspaces",
    icon: FolderOpen,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    name: "Team",
    href: "/team",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "border-r border-gray-200 bg-gray-50 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex h-full flex-col">
        {/* Logo and collapse button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-indigo-500" : "text-gray-400",
                  !isCollapsed && "mr-3"
                )} />
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          {!isCollapsed && (
            <div className="text-xs text-gray-500 text-center">
              Collaboration Platform v1.0
            </div>
          )}
        </div>
      </div>
    </div>
  );
}