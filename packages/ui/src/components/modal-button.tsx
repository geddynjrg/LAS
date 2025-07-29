import { useTranslations } from "next-intl";
import type { FC } from "react";

import { Button, type ButtonProps } from "@workspace/ui/components/button";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
  type modalVariants,
} from "@workspace/ui/components/modal";
import { cn, type VariantProps } from "@workspace/ui/lib/utils";

export interface ModalButtonProps extends Omit<ButtonProps, "onClick"> {
  modalTitle: string;
  modalText?: string;
  confirmTitle?: string;
  cancelTitle?: string;
  showX?: boolean;
  onConfirm?: () => unknown;
  contentProps?: VariantProps<typeof modalVariants>;
  cancelButtonProps?: Omit<ButtonProps, "onClick">;
  titleUnderline?: boolean;
}

export const ModalButton: FC<ModalButtonProps> = ({
  modalTitle,
  modalText,
  confirmTitle,
  cancelTitle,
  onConfirm,
  showX = false,
  contentProps,
  cancelButtonProps,
  titleUnderline,
  ...props
}) => {
  const t = useTranslations();
  return (
    <Modal>
      <ModalTrigger asChild>
        <Button className={cn("!px-5")} {...props} />
      </ModalTrigger>
      <ModalContent showClose={showX} {...contentProps}>
        <ModalTitle
          className={titleUnderline ? "border-b border-neutral-300 pb-4" : ""}
        >
          {modalTitle}
        </ModalTitle>
        <p>{modalText}</p>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="danger" {...cancelButtonProps}>
              {cancelTitle ?? t("Buttons.back")}
            </Button>
          </ModalClose>
          <ModalClose asChild>
            <Button onClick={onConfirm}>
              {confirmTitle ?? t("Buttons.confirm")}
            </Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
