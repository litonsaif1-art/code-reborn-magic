import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorRetryProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorRetry({ message, onRetry, className = "" }: ErrorRetryProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 ${className}`}>
      <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
      <p className="text-sm text-destructive flex-1">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0 gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          পুনরায় চেষ্টা
        </Button>
      )}
    </div>
  );
}
