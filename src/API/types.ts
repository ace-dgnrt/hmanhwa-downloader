import type http from "http";
import type fs from "promise-fs";

export enum Methods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export enum ResponseCode {
  SUCCESS = 200,
  CREATED = 201,

  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  UNSUPPORTED = 415,
  TOO_MANY_REQUESTS = 429,

  SERVER_ERROR = 500,
}

export interface PostInterface<
  P extends Record<string, number | string> = Record<string, any>
> {
  POST<K extends keyof P, D extends string | number | undefined = undefined>(
    key: K,
    defaultValue?: D
  ): D | P[K];
  POST_DATA: P;
}

export interface GetInterface<
  G extends Record<string, string> = Record<string, any>
> {
  GET<K extends keyof G, D extends string | undefined = undefined>(
    key: K,
    defaultValue?: D
  ): G[K] | D;
  GET_DATA: G;
}

export interface ApiRouteInterface<
  P extends Record<string, any> = Record<string, any>,
  G extends Record<string, any> = Record<string, any>
> extends PostInterface<P>,
    GetInterface<G> {
  request: http.IncomingMessage;
  response: http.ServerResponse;
  baseUrl: string;
}

export interface ResponseHandlerResult {
  responseData?: Record<any, any>;
  stream?: fs.ReadStream;
  options?: { isStream: boolean };
}

export type HandlerFunc<
  P extends Record<string, any> = Record<string, any>,
  G extends Record<string, any> = Record<string, any>
> = (api: ApiRouteInterface<P, G>) => Promise<ResponseHandlerResult>;

export type ValidatorFunc = (
  api: ApiRouteInterface
) => Promise<[success: boolean] | [success: boolean, errorMessage: string]>;

export interface ApiRoute {
  urlPattern: string;
  handler: (api: ApiRouteInterface) => Promise<ResponseHandlerResult>;
  methods: Methods[];
}
