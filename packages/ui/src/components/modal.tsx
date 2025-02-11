"use client";

import * as ModalPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "cva-extended";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@workspace/ui/lib/utils";

export const Modal = ModalPrimitive.Root;
export const ModalTrigger = ModalPrimitive.Trigger;
export const ModalPortal = ModalPrimitive.Portal;
export const ModalClose = ModalPrimitive.Close;

export interface ModalOverlayProps {
  className?: string;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  className,
  ...props
}) => (
  <ModalPrimitive.Overlay
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
      className,
    )}
    {...props}
  />
);

export const modalVariants = cva({
  base: "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed left-[50%] top-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 rounded p-6 shadow-[0px_1px_5px_0px_rgba(0,0,0,0.2)] duration-200",
  variants: {
    size: {
      sm: "w-[312px]",
      md: "w-[552px]",
      lg: "w-[840px]",
      fluid: "w-full",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface ModalContentProps extends VariantProps<typeof modalVariants> {
  className?: string;
  children: React.ReactNode;
}

export const ModalContent: React.FC<ModalContentProps> = ({
  className,
  size,
  children,
  ...props
}) => (
  <ModalPortal>
    <ModalOverlay />
    <ModalPrimitive.Content
      className={cn(modalVariants({ size, className }))}
      {...props}
    >
      {children}
      <ModalPrimitive.Close
        asChild
        className="absolute right-3 top-3 rounded-sm"
      >
        <X className="text-neutral-600" />
      </ModalPrimitive.Close>
    </ModalPrimitive.Content>
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
