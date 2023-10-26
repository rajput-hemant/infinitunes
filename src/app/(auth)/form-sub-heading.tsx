"use client";

import { usePathname } from "next/navigation";

import { H3 } from "@/components/ui/topography";

const FormSubHeading = () => {
  const isLoginPage = usePathname() === "/login";

  return (
    <div className="flex flex-col space-y-2 text-center">
      <H3 className="text-2xl font-semibold tracking-tight">
        {isLoginPage ? "Login" : "Create an account"}
      </H3>

      <p className="text-muted-foreground text-sm">
        {isLoginPage
          ? "Enter your email below to login"
          : "Enter your email below to create your account"}
      </p>
    </div>
  );
};

export default FormSubHeading;
