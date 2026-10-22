import { SheetHeader } from "~/components/sheet-header";
import { LanguagesScreen } from "~/features/settings/languages-screen";

export default function LanguagesRoute() {
  return (
    <>
      <SheetHeader title="Languages" />
      <LanguagesScreen />
    </>
  );
}
