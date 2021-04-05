import {
  ApiRouteInterface,
  ResponseCode,
  ResponseHandlerResult,
} from "../types";
import http from "http";
import {
  DataType,
  FieldValidators,
  FilterDataTypes,
  GetUndefinedTypes,
  MapDataType,
  Validator,
  ValidatorList,
} from "./types";

function verifyFieldExistence(
  key: string,
  required: boolean,
  data: Record<string, any>
) {
  if (required) {
    if (!data.hasOwnProperty(key)) {
      throw new Error(`[${key}] field cannot be empty`);
    }
  }
}

function throwUnexpectedTypeError(fieldName: string) {
  throw new Error(`Unexpected type on [${fieldName}]`);
}

function verifyFieldType(
  key: string,
  expectedType: DataType,
  data: Record<string, any>
) {
  if (data.hasOwnProperty(key)) {
    const fieldType = typeof data[key];
    switch (expectedType) {
      case DataType.String:
        if (fieldType !== "string") throwUnexpectedTypeError(key);
        break;
      case DataType.Number:
        if (fieldType !== "number") throwUnexpectedTypeError(key);
        break;
      case DataType.Boolean:
        if (fieldType !== "boolean") throwUnexpectedTypeError(key);
        break;
      case DataType.Array:
        if (!Array.isArray(data[key])) throwUnexpectedTypeError(key);
        break;
      case DataType.Object:
        if (fieldType !== "object" || data[key] === null)
          throwUnexpectedTypeError(key);
        break;
    }
  }
}

async function verifyFieldCustomValidator(
  key: string,
  customValidator: Validator<any>["validateFn"],
  data: Record<string, any>
) {
  const [isValid, message] = await customValidator!({ [key]: data[key] });
  if (!isValid) {
    throw new Error(message);
  }
}

async function verifyFields(
  validators: ValidatorList<any>,
  data: Record<string, any>
) {
  const awaitingFor: Promise<void>[] = [];
  for (const requirements of validators) {
    verifyFieldExistence(requirements.key, requirements.required, data);
    verifyFieldType(requirements.key, requirements.type, data);
    if (requirements.validateFn)
      awaitingFor.push(
        verifyFieldCustomValidator(
          requirements.key,
          requirements.validateFn,
          data
        )
      );
  }
  await Promise.all(awaitingFor).catch((e) => {
    throw e;
  });
}

async function executeFieldValidators(
  validators: FieldValidators<any, any>,
  GET_DATA: ApiRouteInterface["GET_DATA"],
  POST_DATA: ApiRouteInterface["POST_DATA"]
) {
  const awaitingFor: Promise<void>[] = [];
  if (validators.hasOwnProperty("GET") && validators.GET !== undefined)
    awaitingFor.push(verifyFields(validators.GET, GET_DATA));

  if (validators.hasOwnProperty("POST") && validators.POST !== undefined)
    awaitingFor.push(verifyFields(validators.POST, POST_DATA));

  await Promise.all(awaitingFor);
}

export function ValidateField<
  R extends boolean,
  T extends DataType,
  K extends string
>(options: {
  readonly key: K;
  readonly required: R;
  readonly type: T;
  validateFn?: (
    field: R extends false
      ? Partial<Record<K, MapDataType<T>>>
      : Record<K, MapDataType<T>>
  ) => Promise<[isValid: boolean, message: string]>;
}) {
  return options;
}

export function RequestHandler<GD extends {} = {}, PD extends {} = {}>() {
  let requestValidators = () => ({} as FieldValidators<any, any>);
  let requestResponseMethod: (data: {
    GET_DATA: any;
    POST_DATA: any;
    request: http.IncomingMessage;
    response: http.ServerResponse;
    baseUrl: string;
  }) => Promise<ResponseHandlerResult> = async () => ({});

  const handler = async (
    api: ApiRouteInterface
  ): Promise<ResponseHandlerResult> => {
    try {
      await executeFieldValidators(
        requestValidators(),
        api.GET_DATA,
        api.POST_DATA
      );
      return await requestResponseMethod(api);
    } catch (e) {
      api.response.statusCode = ResponseCode.BAD_REQUEST;
      if (e instanceof Error)
        return { responseData: { error: (e as Error).message } };
      return {};
    }
  };

  const withValidation = <
    VGD extends ValidatorList<GD & Record<string, any>> = [],
    PGD extends ValidatorList<PD & Record<string, any>> = []
  >(
    validators?: () => { GET?: VGD; POST?: PGD }
  ) => {
    requestValidators = validators || requestValidators;
    return {
      sendResponse(
        method: (data: {
          GET_DATA: GetUndefinedTypes<GD, FilterDataTypes<VGD[number]>>;
          POST_DATA: GetUndefinedTypes<PD, FilterDataTypes<PGD[number]>>;
          request: http.IncomingMessage;
          response: http.ServerResponse;
          baseUrl: string;
        }) => Promise<ResponseHandlerResult>
      ) {
        requestResponseMethod = method;
        return handler;
      },
    };
  };

  const sendResponseWithoutValidation = (
    method: (data: {
      GET_DATA: GetUndefinedTypes<GD, {}>;
      POST_DATA: GetUndefinedTypes<PD, {}>;
      request: http.IncomingMessage;
      response: http.ServerResponse;
      baseUrl: string;
    }) => Promise<ResponseHandlerResult>
  ) => {
    requestResponseMethod = method;
    return handler;
  };

  return {
    withValidation,
    sendResponseWithoutValidation,
  };
}
