import { SheetHeader } from "~/components/sheet-header";
import { QueueList } from "~/features/player/queue-list";

export default function QueueScreen() {
  return (
    <>
      <SheetHeader title="Up Next" />
      <QueueList />
    </>
  );
}
