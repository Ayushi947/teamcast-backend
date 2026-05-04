import { IApiResponse } from '@/shared/models/api/common/common.api';
import { Response } from 'express';
import { ErrorCode } from './error.codes';

/**
 * Constructs a standardized API response object
 * @param success Whether the operation was successful
 * @param data Optional data to include in the response
 * @param error Optional error message if operation failed
 * @param message Optional success message
 * @returns Standardized API response object
 */
export function constructIApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): IApiResponse<T> {
  return {
    success,
    data,
    error,
    message,
  };
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: any = null,
    message: string = 'Success'
  ): void {
    const response = {
      success: true,
      message,
      data,
    };
    res.status(200).json(response as T);
  }

  static created(
    res: Response,
    data: any = null,
    message: string = 'Created Successfully'
  ): void {
    res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static error(
    res: Response,
    error: any,
    errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: number = 400
  ): void {
    const message = error instanceof Error ? error.message : String(error);
    const code = error.code || errorCode;
    const status = error.statusCode || statusCode;

    res.status(status).json({
      success: false,
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack || new Error().stack,
      }),
    });
  }
}
