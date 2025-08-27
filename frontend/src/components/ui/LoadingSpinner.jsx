import { cn } from "@/lib/utils";

export function LoadingSpinner({ size = "md", className }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-primary",
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

export function PageLoader({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}

export function InlineLoader({ size = "sm", message, className }) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <LoadingSpinner size={size} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}
