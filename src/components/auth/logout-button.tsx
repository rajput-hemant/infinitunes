"use client";

import { signOut } from "next-auth/react";

import { Button } from "../ui/button";

const LogoutButton = () => {
  const clickhandler = async () => {
    await signOut();
  };

  return <Button onClick={clickhandler}>Logout</Button>;
};

export default LogoutButton;
