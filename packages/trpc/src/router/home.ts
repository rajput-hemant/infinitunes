import type { Modules } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { api } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { homeInput } from "../lib/inputs";
import { publicProcedure, router } from "../trpc";
import { isRecord, withDownloadUrl } from "./utils";

export const homeRouter = router({
  home: publicProcedure
    .input(homeInput)
    .output(z.custom<Modules>())
    .query(async ({ input }) => {
      const result = await api(endpoints.modules.launch_data, {
        language: input.lang,
      });
      if (!isRecord(result)) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Unexpected response from upstream",
        });
      }
      for (const value of Object.values(result)) {
        if (!Array.isArray(value)) continue;
        for (let i = 0; i < value.length; i++) {
          value[i] = withDownloadUrl(value[i]);
        }
      }
      return result as Modules;
    }),
});
