import type http from "http";
import qs from "querystring";
import url from "url";
import { Logger } from "../utils/Logger";
import { ContentType, Header } from "./Headers";
import type {
  ApiRoute,
  ApiRouteInterface,
  GetInterface,
  Methods,
  PostInterface,
} from "./types";
import { ResponseCode } from "./types";

const protocol: "http" | "https" = "http";

function comparePathNameToPattern(pathname: string, pattern: string) {
  const pathnameParts = pathname.split("/");
  const patternParts = pattern.split("/");
  if (pathnameParts.every((part, index) => part === patternParts[index])) {
    return true;
  }
  return false;
}

export default class Api {
  routes: ApiRoute[] = [];
  constructor() {}

  register(config: ApiRoute) {
    if (
      !this.routes.find(
        (r) =>
          comparePathNameToPattern(r.urlPattern, config.urlPattern) &&
          r.methods.some((m) => config.methods.includes(m))
      )
    ) {
      this.routes.push(config);
    }
  }

  async handleRequest(
    request: http.IncomingMessage,
    response: http.ServerResponse
  ) {
    try {
      response.setHeader(Header.ContentType, ContentType.JSON);

      const matchingRoutes = this.findMatchingRoutes(request, response);

      if (!matchingRoutes) {
        response.statusCode = ResponseCode.NOT_FOUND;
        response.end();
        return;
      }

      const route = this.findRoute(matchingRoutes, request, response);

      if (!route) {
        response.statusCode = ResponseCode.NOT_FOUND;
        response.end();
        return;
      }

      const pdata = await this.parsePostRequestData(request);
      const gdata = this.parseGetRequestData(request);
      const apiInterface = {
        ...pdata,
        ...gdata,
        request,
        response,
        baseUrl: `${protocol}://${request.headers.host}`,
      };

      this.sendResponse(response, apiInterface, route);
    } catch (e) {
      Logger.warning(e.message, e);
      response.statusCode = ResponseCode.SERVER_ERROR;
      response.end();
    }
  }

  private findRoute(
    matchingRoutes: ApiRoute[],
    request: http.IncomingMessage,
    response: http.ServerResponse
  ) {
    const route = matchingRoutes.find(
      (route) =>
        request.method && route.methods.includes(request.method as Methods)
    );
    if (!route) {
      response.statusCode = ResponseCode.METHOD_NOT_ALLOWED;
      response.end();
      return;
    }
    return route;
  }

  private findMatchingRoutes(
    request: http.IncomingMessage,
    response: http.ServerResponse
  ) {
    const u = new url.URL(
      request.url || "",
      `${protocol}://${request.headers.host}`
    );
    const matchingRoutes = this.routes.filter((route) =>
      comparePathNameToPattern(u.pathname, route.urlPattern)
    );
    if (matchingRoutes.length === 0) {
      response.statusCode = ResponseCode.NOT_FOUND;
      response.end();
      return;
    }
    return matchingRoutes;
  }

  private async sendResponse(
    response: http.ServerResponse,
    apiInterface: ApiRouteInterface,
    route: ApiRoute
  ) {
    const handlerResult = await route.handler(apiInterface);
    response.statusCode = ResponseCode.SUCCESS;
    if (handlerResult.options?.isStream && !!handlerResult.stream) {
      handlerResult.stream.pipe(response);
    } else {
      response.end(JSON.stringify(handlerResult.responseData || {}));
    }
  }

  private parseGetRequestData(request: http.IncomingMessage): GetInterface {
    const params = new url.URL(
      request.url || "",
      `http://${request.headers.host}`
    ).searchParams.entries();
    const data: Record<string, string> = {};
    for (const [key, val] of params) {
      Object.assign(data, { [key]: val });
    }
    return {
      GET_DATA: data,
      GET: function (key, dv) {
        if (this.GET_DATA.hasOwnProperty(key)) {
          return this.GET_DATA[key];
        } else {
          return dv as any;
        }
      },
    };
  }

  private parsePostRequestData(request: http.IncomingMessage) {
    return new Promise<PostInterface>((resolve, reject) => {
      const buffer: any[] = [];
      let size = 0;
      request.on("data", (data) => {
        buffer.push(data);
        size += data.length;
        if (size > 1e6) {
          request.socket.destroy();
          reject("Buffer overflow");
        }
      });
      request.on("end", () => {
        const post: PostInterface = {
          POST_DATA: {},
          POST: function (key, dv) {
            if (this.POST_DATA.hasOwnProperty(key)) {
              return this.POST_DATA[key];
            } else {
              return dv as any;
            }
          },
        };
        if (request.headers["content-type"] === ContentType.FORM) {
          const querystring = qs.parse(buffer.join());
          post.POST_DATA = querystring as any;
          resolve(post);
        } else if (request.headers["content-type"] === ContentType.JSON) {
          const querystring = JSON.parse(buffer.join());
          post.POST_DATA = querystring;
          resolve(post);
        } else {
          resolve({ POST_DATA: {}, POST: (_, dv) => dv as any });
        }
      });
    });
  }
}
