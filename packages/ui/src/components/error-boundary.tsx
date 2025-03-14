"use client";

import { IconReload } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { Component, type ErrorInfo, type FC, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";

export interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo.componentStack);
  }

  public render() {
    // Check if the error is thrown
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <DefaultErrorScreen
            onReload={() => this.setState({ hasError: false })}
          />
        )
      );
    }

    // Return children components in case of no error
    return this.props.children;
  }
}

const DefaultErrorScreen: FC<{ onReload: () => void }> = ({ onReload }) => {
  const t = useTranslations("ErrorBoundary");

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="space-y-3 text-center">
        <h2 className="typo-h2">{t("title")}</h2>
        <p className="typo-body">{t("description")}</p>
        <Button type="button" variant="ghost" onClick={onReload}>
          {t("button")} <IconReload />
        </Button>
      </div>
    </div>
  );
};
