import { AppearanceSettings } from "./appearance-settings";

export default function Page() {
  return (
    <>
      <div className="space-y-1 border-b p-4">
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-muted-foreground text-sm">
          Customize the appearance of the app. Automatically switch between day
          and night themes.
        </p>
      </div>

      <div className="p-6">
        <AppearanceSettings />
      </div>
    </>
  );
}
