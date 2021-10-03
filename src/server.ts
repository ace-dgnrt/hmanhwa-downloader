import http from "http";
import { isMainThread } from "worker_threads";

import Api from "@Api/api";
import { initiateEndpoints } from "@Endpoints/InitiateEndpoints";
import { initiateStores } from "@Routines/InitiateStores/InitiateStores";
import { Logger } from "@Utils/Logger";

declare const process: any;

let API: Api;

if (isMainThread) {
  const hostname = process.ENV.hostname;
  const port = process.ENV.port;

  API = new Api();

  Logger.info("Starting new server");

  const server = http.createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", process.ENV.cors);
    response.setHeader("Access-Control-Request-Method", "*");
    response.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
    response.setHeader(
      "Access-Control-Allow-Headers",
      request.headers.origin ?? "*"
    );
    API.handleRequest(request, response);
  });

  initiateStores();

  initiateEndpoints(API);

  Logger.info(`Listening on address [${hostname}:${port}]`);

  server.listen(port, hostname);
}
