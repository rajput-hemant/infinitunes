"use client";

import { BellIcon, CheckIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Theme } from "@/types/theme";
import { cn } from "@/lib/utils";
import { useConfig } from "@/hooks/use-config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const notifications = [
  { title: "Your call has been confirmed.", description: "1 hour ago" },
  { title: "You have a new message!", description: "1 hour ago" },
  { title: "Your subscription is expiring soon!", description: "2 hours ago" },
];

export default function CardDemo() {
  const [_, setConfig] = useConfig();
  const { theme, setTheme } = useTheme();

  function handleClick(theme: Theme["name"], radius = 0.5) {
    setConfig((p) => ({
      theme: {
        name: theme,
        style: p.theme.style,
        radius,
      },
    }));
  }

  return (
    <div className="grid h-screen w-screen place-items-center">
      <Card className={cn("w-[380px]")}>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>You have 3 unread messages.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className=" flex items-center space-x-4 rounded-md border p-4">
            <BellIcon />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                Push Notifications
              </p>
              <p className="text-sm text-muted-foreground">
                Send notifications to device.
              </p>
            </div>
            <Switch
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            />
          </div>
          <div>
            {notifications.map((notification, index) => (
              <div
                key={index}
                className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
              >
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">
            <CheckIcon className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        </CardFooter>
      </Card>

      <div className="flex gap-4">
        <Button onClick={() => handleClick("neutral")}>neutral</Button>
        <Button onClick={() => handleClick("blue")}>blue</Button>
        <Button onClick={() => handleClick("green")}>green</Button>
        <Button onClick={() => handleClick("orange")}>orange</Button>
        <Button onClick={() => handleClick("rose")}>rose</Button>
        <Button onClick={() => handleClick("violet")}>violet</Button>
        <Button onClick={() => handleClick("stone", 1)}>stone</Button>
      </div>
    </div>
  );
}
