import {
  CustomResponse,
  FooterDetails,
  Lang,
  MegaMenu,
  Modules,
} from "@/types";

import { env } from "./env.mjs";

const jioSaavnGetCall = async <T>(
  path: string,
  query?: Record<string, string>
): Promise<T | undefined> => {
  const url = new URL(path, env.JIOSAAVN_API_URL);
  url.search = new URLSearchParams(query).toString();

  const response = await fetch(url);
  const data = (await response.json()) as CustomResponse<T>;

  if (!response.ok) throw new Error(data.message);

  return data.data;
};

const getHomeData = async (langs?: Lang[], mini: boolean = true) => {
  return await jioSaavnGetCall<Modules>("/modules", {
    lang: langs ? langs.join(",") : "",
    mini: `${mini}`,
  });
};

const getFooterDetails = async (langs?: Lang[]) => {
  return await jioSaavnGetCall<FooterDetails>("/get/footer-details", {
    lang: langs ? langs.join(",") : "hindi",
  });
};

export async function getMegaMenu(entity = false, lang?: Lang[]) {
  return await jioSaavnGetCall<MegaMenu>("/get/mega-menu", {
    entity: `${entity}`,
    lang: lang?.join(",") ?? "",
  });
}

export const api = {
  getHomeData,
  getFooterDetails,
  getMegaMenu,
};
