import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import {
  Coffee,
  Bell,
  Menu as MenuIcon,
  X,
  LogOut,
  User,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function DashboardLayout({
  user,
  navigation,
  activeTab,
  setActiveTab,
  title,
  notifications = [],
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <Link to="/" className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-rose-600" />
              <span className="text-xl font-bold gradient-text">MenuSnap</span>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                  // Navigate to the correct route based on current path
                  const basePath = window.location.pathname.split("/")[1];
                  if (item.id === "overview") {
                    navigate(`/${basePath}`);
                  } else {
                    navigate(`/${basePath}/${item.id}`);
                  }
                }}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeTab === item.id
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t px-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-rose-600">
                    {user?.firstName?.[0] || "U"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white border-b px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>

              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>

              {/* User menu */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "shadow-lg",
                    userButtonPopoverActionButton: "hover:bg-gray-100",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
