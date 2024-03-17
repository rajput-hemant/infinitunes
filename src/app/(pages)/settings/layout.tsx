import { Separator } from "@/components/ui/separator";
import { SettingsSidebarNav } from "./settings-sidebar-nav";

type Props = {
  children: React.ReactNode;
};

const SettingsLayout = ({ children }: Props) => {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 space-y-1 px-2">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account, appearance, and preference settings.
        </p>
      </div>

      <Separator />

      <div className="flex h-full flex-1 flex-col lg:flex-row">
        <aside className="pt-2 lg:max-w-[16rem] lg:border-r lg:pr-4 lg:pt-4 xl:w-1/5">
          <SettingsSidebarNav />
        </aside>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default SettingsLayout;
