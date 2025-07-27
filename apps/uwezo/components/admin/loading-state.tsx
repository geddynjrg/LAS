import { IconLoader } from "@tabler/icons-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className = "min-h-screen",
}: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="text-center">
        <IconLoader className="mx-auto h-10 w-10 animate-spin text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}
