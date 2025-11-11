/**
 * Standard response helpers for consistent API responses
 */

export enum StatusResponse {
  success = "success",
  error = "error",
}

export const RESPONSE_MESSAGE = {
  success: "Success",
  error: "Error",
  validationError: "Validation error",
};

type ResponseResult = {
  status: StatusResponse;
  message: string;
  result?: any;
  size?: number | null;
  page?: number | null;
  total?: number | null;
};

type InputCreateResponse = {
  status: StatusResponse;
  message: string;
  result?: any;
};

const createResponse = (options: InputCreateResponse): ResponseResult => {
  const result: ResponseResult = {
    status: options.status,
    message: options.message,
    result: options.result,
  };

  return result;
};

export type InputCreateMessage = {
  message?: string;
  result?: any;
};

export const createSuccessMessage = (options?: InputCreateMessage) => {
  if (!options) {
    return createResponse({
      status: StatusResponse.success,
      message: RESPONSE_MESSAGE.success,
    });
  }

  return createResponse({
    status: StatusResponse.success,
    message: options.message || RESPONSE_MESSAGE.success,
    result: options.result,
  });
};

export const createErrorMessage = (options?: InputCreateMessage) => {
  if (!options) {
    return createResponse({
      status: StatusResponse.error,
      message: RESPONSE_MESSAGE.error,
    });
  }

  return createResponse({
    status: StatusResponse.error,
    message: options.message || RESPONSE_MESSAGE.error,
    result: options.result,
  });
};

export type InputCreateSuccessPaginate = {
  result: any;
  size: number | null;
  page: number | null;
  total: number | null;
};

export const createSuccessPaginate = (
  options?: InputCreateSuccessPaginate
): ResponseResult => {
  if (!options) {
    return createResponse({
      status: StatusResponse.success,
      message: RESPONSE_MESSAGE.success,
    });
  }

  const result: ResponseResult = {
    status: StatusResponse.success,
    message: RESPONSE_MESSAGE.success,
    result: options.result,
    size: options.size,
    page: options.page,
    total: options.total,
  };

  return result;
};

export const serializeBigInt = (obj: any, isNumber: boolean = true): any => {
  if (typeof obj === "bigint") {
    return isNumber ? Number(obj) : obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item, isNumber));
  } else if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        serializeBigInt(value, isNumber),
      ])
    );
  }
  return obj;
};

