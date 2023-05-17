import React from "react";
import { BsCheckCircleFill } from "react-icons/bs";
import { FiAlertTriangle } from "react-icons/fi";
import { MdError } from "react-icons/md";

import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./button";
import { TopographyLarge } from "./topography";

export type DialogProps = {
  open?: boolean;
  heading: string;
  type?: "alert" | "success" | "warning" | "error";
  className?: string;
  children: React.ReactNode;
};

export type DialogActionsProp = ButtonProps;

const Dialog = ({ open, heading, type, className, children }: DialogProps) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;

    // open dialog by default
    open ?? dialog?.showModal();

    // open dialog when open prop changes
    open && dialog?.showModal();

    return () => dialog?.close();
  }, [open]);

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "w-full rounded-md p-4 shadow-lg md:min-w-[24rem]",
        className
      )}
    >
      <TopographyLarge
        className={cn(
          "flex items-center gap-1",
          (type === "alert" || type === "warning") && "text-yellow-500",
          type === "success" && "text-green-500",
          type === "error" && "text-red-500"
        )}
      >
        {(type === "alert" || type === "warning") && (
          <FiAlertTriangle size={24} />
        )}
        {type === "success" && <BsCheckCircleFill size={25} />}
        {type === "error" && <MdError size={25} />}

        {heading}
      </TopographyLarge>

      <div className="p-2">{children}</div>

      <div className="ml-auto flex">
        <Button
          variant="outline"
          onClick={closeDialog}
          className="hover:bg-muted ml-auto"
        >
          {type === "success" ? "Done" : "Close"}
        </Button>
      </div>
    </dialog>
  );
};

export default Dialog;
