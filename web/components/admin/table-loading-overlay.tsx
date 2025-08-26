import { IconLoader } from '@tabler/icons-react';

interface TableLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export function TableLoadingOverlay({
  isLoading,
  message = 'Loading...',
}: TableLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <IconLoader className="h-5 w-5 animate-spin text-gray-600" />
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </div>
  );
}
