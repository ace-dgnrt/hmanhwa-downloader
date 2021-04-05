import ReqHandler from "./index";
import Api from "../../API/api";
import { Methods } from "../../API/types";

export const registerRoutes = (api: Api) => {
  api.register({
    urlPattern: "/scrap-chapter",
    methods: [Methods.GET],
    handler: ReqHandler,
  });
};
