import { PreferenceSettings } from "./preference-settings";

export default function Page() {
  return (
    <>
      <div className="space-y-1 border-b p-4">
        <h3 className="text-lg font-medium">Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Configure your preferences like language, music stream, download
          quality, etc.
        </p>
      </div>

      <div className="p-6">
        <PreferenceSettings />
      </div>
    </>
  );
}
