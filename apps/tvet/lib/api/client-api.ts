import createClient from "openapi-fetch";

import type { paths } from "./schema/schema";

export const clientApi = createClient<paths>({
  baseUrl: "",
});
