import { error as openApiError } from 'express-openapi-validator';

export interface OpenApiError {
  name: string;
  status: number;
  errors: unknown;
}

export function isOpenApiError(error: unknown): error is OpenApiError {
  return (
    Object.values(openApiError).some((validationError) => error instanceof validationError) &&
    (error as OpenApiError).name !== undefined &&
    (error as OpenApiError).status !== undefined &&
    (error as OpenApiError).errors !== undefined
  );
}
