"use client";

import * as ModalPrimitive from "@radix-ui/react-dialog";
import { IconX } from "@tabler/icons-react";
import { cva, type VariantProps } from "cva-extended";
import type { ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export const Modal = ModalPrimitive.Root;
export const ModalTrigger = ModalPrimitive.Trigger;
export const ModalPortal = ModalPrimitive.Portal;
export const ModalClose = ModalPrimitive.Close;

export interface ModalOverlayProps {
  className?: string;
  children?: ReactNode;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  className,
  children,
  ...props
}) => (
  <ModalPrimitive.Overlay
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4",
      className,
    )}
    {...props}
  >
    {children}
  </ModalPrimitive.Overlay>
);

export const modalVariants = cva({
  base: "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 relative z-50 duration-200",
  variants: {
    variant: {
      primary:
        "bg-background grid gap-4 rounded p-6 shadow-[0px_1px_5px_0px_rgba(0,0,0,0.2)]",
      transparent: "",
    },
    size: {
      sm: "w-[312px] max-w-full",
      md: "w-[552px] max-w-full",
      lg: "w-[840px] max-w-full",
      fluid: "w-full",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface ModalContentProps extends VariantProps<typeof modalVariants> {
  className?: string;
  children: React.ReactNode;
  showClose?: boolean;
  asChild?: boolean;
}

export const ModalContent: React.FC<ModalContentProps> = ({
  className,
  size,
  variant,
  children,
  showClose = true,
  ...props
}) => (
  <ModalPortal>
    <ModalOverlay>
      <ModalPrimitive.Content
        className={cn(modalVariants({ size, variant, className }))}
        {...props}
      >
        {children}
        {showClose && (
          <ModalPrimitive.Close className="absolute right-2 top-2" asChild>
            <Button
              variant="ghost"
              className={cn(variant === "transparent" && "bg-neutral-100/70")}
            >
              <IconX className="text-neutral-600" />
            </Button>
          </ModalPrimitive.Close>
        )}
      </ModalPrimitive.Content>
      <ModalPrimitive.Description />
    </ModalOverlay>
  </ModalPortal>
);

interface ModalFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  className,
  children,
}) => {
  return (
    <div className={cn("flex flex-row justify-end gap-4", className)}>
      {children}
    </div>
  );
};

interface ModalTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const ModalTitle: React.FC<ModalTitleProps> = ({
  className,
  children,
}) => (
  <ModalPrimitive.Title
    className={cn("text-neutral-1000 text-2xl font-bold", className)}
  >
    {children}
  </ModalPrimitive.Title>
);
