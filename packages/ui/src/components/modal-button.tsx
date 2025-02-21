import type { FC } from "react";

import { Button, type ButtonProps } from "@workspace/ui/components/button";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
} from "@workspace/ui/components/modal";
import { cn } from "@workspace/ui/lib/utils";

export interface ModalButtonProps extends Omit<ButtonProps, "onClick"> {
  modalTitle: string;
  modalText?: string;
  confirmTitle?: string;
  cancelTitle?: string;
  showX?: boolean;
  onConfirm?: () => unknown;
}

export const ModalButton: FC<ModalButtonProps> = ({
  modalTitle,
  modalText,
  confirmTitle = "Confirm",
  cancelTitle = "Back",
  onConfirm,
  showX = false,
  ...props
}) => {
  return (
    <Modal>
      <ModalTrigger asChild>
        <Button className={cn("!px-5")} {...props} />
      </ModalTrigger>
      <ModalContent showClose={showX}>
        <ModalTitle>{modalTitle}</ModalTitle>
        <p>{modalText}</p>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="danger">{cancelTitle}</Button>
          </ModalClose>
          <ModalClose asChild>
            <Button onClick={onConfirm}>{confirmTitle}</Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
