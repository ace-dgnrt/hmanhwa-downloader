import ReqHandler from "./index";
import Api from "../API/api";
import { Methods } from "../API/types";

export const downloadPathname = "/download";

export function registerRoutes(api: Api) {
  api.register({
    urlPattern: downloadPathname,
    methods: [Methods.GET],
    handler: ReqHandler,
  });
}
