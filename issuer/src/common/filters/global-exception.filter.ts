import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof BadRequestException) {
      const errorBody = exception.getResponse() as {
        message?: string | string[];
      };
      const message = this.formatValidationMessage(errorBody.message);
      response.status(400).json({
        error: 'Validation Error',
        message,
        status: 400,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse() as
        | string
        | { message?: string | string[]; error?: string };

      response.status(status).json({
        error:
          typeof payload === 'object' && payload.error
            ? payload.error
            : 'Request Failed',
        message: this.extractHttpMessage(payload),
        status,
      });
      return;
    }

    const fallbackMessage =
      exception instanceof Error ? exception.message : 'Unexpected error';

    response.status(500).json({
      error: 'Internal Server Error',
      message: fallbackMessage,
      status: 500,
    });
  }

  private formatValidationMessage(message?: string | string[]): string {
    if (Array.isArray(message)) {
      const first = message[0] ?? 'Validation failed';
      return `{validation:${first}}`;
    }

    if (typeof message === 'string') {
      return message;
    }

    return 'Validation failed';
  }

  private extractHttpMessage(
    responseBody: { message?: string | string[] } | string,
  ): string {
    if (typeof responseBody === 'string') {
      return responseBody;
    }

    if (Array.isArray(responseBody.message)) {
      return responseBody.message[0] ?? 'Request failed';
    }

    return responseBody.message ?? 'Request failed';
  }
}
