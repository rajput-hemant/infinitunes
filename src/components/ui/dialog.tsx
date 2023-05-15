import React from "react";
import { BsCheckCircleFill } from "react-icons/bs";
import { FiAlertTriangle } from "react-icons/fi";
import { MdError } from "react-icons/md";

import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./button";
import { TopographyLarge } from "./topography";

export type DialogProps = {
  heading: string;
  type?: "alert" | "success" | "warning" | "error";
  className?: string;
  children: React.ReactNode;
};

export type DialogActionsProp = ButtonProps;

const Dialog = ({ heading, type, className, children }: DialogProps) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => dialog?.close();
  }, []);

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn("w-full rounded-md p-4 shadow-lg md:w-96", className)}
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
