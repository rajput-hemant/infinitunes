import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { homeInput } from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { withDownloadUrl } from "./utils";

export const homeRouter = router({
  home: publicProcedure.input(homeInput).query(async ({ input }) => {
    const result = await api(endpoints.modules.launch_data, {
      language: input.lang,
    });
    const payload = result as Record<string, unknown>;
    for (const value of Object.values(payload)) {
      if (Array.isArray(value))
        value.forEach((v, i, arr) => (arr[i] = withDownloadUrl(v)));
    }
    return result;
  }),
});
