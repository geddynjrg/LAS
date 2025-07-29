import { IconAlertCircle } from "@tabler/icons-react";

import { Container } from "@workspace/ui/components/container";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Error",
  message,
  onRetry,
  retryLabel = "Retry",
}: ErrorStateProps) {
  return (
    <Container className="py-8">
      <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <IconAlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-lg font-semibold text-red-800">{title}</h2>
        <p className="text-red-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </Container>
  );
}
