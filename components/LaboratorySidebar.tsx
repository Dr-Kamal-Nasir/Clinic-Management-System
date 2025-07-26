// components/LaboratorySidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

const sidebarItems = [
  {
    name: "Dashboard",
    href: "/laboratory/dashboard",
    icon: LayoutDashboard
  },
  {
    name: "Records",
    href: "/laboratory/records",
    icon: FileText
  },
  {
    name: "Expenses",
    href: "/laboratory/expenses",
    icon: DollarSign
  },
];

export function LaboratorySidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuthStore();

  return (
    <div
      className={cn(
        "relative h-screen border-r pt-8 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 rounded-full border"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="flex flex-col h-full">
        <div className="px-4 mb-8">
          {isCollapsed ? (
            <h1 className="text-xl font-bold text-center">L</h1>
          ) : (
            <h1 className="text-xl font-bold">Laboratory</h1>
          )}
        </div>

        {/* Back to Main Dashboard Button (Admin Only) */}
        {user?.role === 'admin' && (
          <div className={cn(
            "px-2 mb-4",
            isCollapsed ? "flex justify-center" : ""
          )}>
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isCollapsed ? "justify-center" : "justify-start"
              )}
            >
              <Home className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Main Dashboard</span>}
            </Link>
          </div>
        )}

        <nav className="flex-1 px-2 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent" : "text-muted-foreground",
                isCollapsed ? "justify-center" : "justify-start"
              )}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {!isCollapsed && (
          <div className="p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Current Month: {new Date().toLocaleString('default', { month: 'long' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}