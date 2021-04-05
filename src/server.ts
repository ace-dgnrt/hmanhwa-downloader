import http from "http";
import Api from "./API/api";
import { registerRoutes as chapterRoutes } from "./routes/scrappChapter/urls";
import { registerRoutes as hosterRoutes } from "./scrapHoster/urls";
import { registerRoutes as titleRoutes } from "./routes/scrappTitle/urls";

declare const process: any;

const hostname = process.ENV.hostname;
const port = process.ENV.port;

const api = new Api();

titleRoutes(api);
chapterRoutes(api);
hosterRoutes(api);

const server = http.createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", process.ENV.cors);
  response.setHeader("Access-Control-Request-Method", "*");
  response.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
  response.setHeader(
    "Access-Control-Allow-Headers",
    request.headers.origin || "*"
  );
  api.handleRequest(request, response);
});

server.listen(port, hostname);
