import Image from "next/image";

import { getUser } from "@/lib/auth";

export default async function SettingsProfilePage() {
  const user = await getUser();

  return (
    <div>
      <div id="edit-profile">
        <div className="space-y-1 border-b p-4">
          <h3 className="text-xl font-medium">Edit Profile</h3>
          <p className="text-sm text-muted-foreground">
            This is how others will see you on the site.
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative size-32 overflow-hidden rounded-full ring-2 ring-ring ring-offset-background">
              <Image
                src={user?.image ?? "/images/placeholder/user.jpg"}
                alt={user?.name ?? "Profile Photo"}
                fill
              />
            </div>

            <div className="">
              <h4>{user?.name}</h4>
            </div>
          </div>
        </div>
      </div>

      <div id="change-password"></div>
      <div id="delete-account"></div>
    </div>
  );
}
