import Api from "../../API/api";
import { Methods } from "../../API/types";
import ReqHandler from "./ScrapTitle";

export function registerRoutes(api: Api) {
  api.register({
    urlPattern: "/scrap-title",
    methods: [Methods.GET],
    handler: ReqHandler,
  });
}
