import { HttpException, HttpStatus } from '@nestjs/common';

export class CircularDependencyException extends HttpException {
  constructor(message = 'The prerequisite change would create a cycle.') {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code: 'CIRCULAR_DEPENDENCY',
        message,
      },
      HttpStatus.CONFLICT,
    );
  }
}

