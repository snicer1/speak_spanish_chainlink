/**
 * TypeScript types and interfaces for testing
 */

export interface TranslationResponse {
  original: string;
  translation: string;
  target_lang: string;
  cached?: boolean;
}

export interface HealthCheckResponse {
  status: string;
  database: string;
  deepl_configured: boolean;
}

export interface ApiInfoResponse {
  message: string;
  endpoints: {
    [key: string]: string;
  };
}

export interface OpenApiSchema {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  paths: {
    [endpoint: string]: {
      [method: string]: {
        summary?: string;
        description?: string;
        operationId: string;
        parameters?: any[];
        responses: {
          [statusCode: string]: {
            description: string;
            content?: {
              'application/json'?: {
                schema?: any;
              };
            };
          };
        };
      };
    };
  };
}
