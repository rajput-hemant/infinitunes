import { PageTitle } from "~/components/page-title";

import { useHomeGreeting } from "./home-header";

/** Android's Home opens with the greeting as the page's display title. */
export function HomeTitle() {
  return <PageTitle title={useHomeGreeting()} />;
}
