import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { ZodError, ZodSchema } from 'zod'

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodSchema<T>) {}

  transform(value: any) {
    try {
      return this.schema.parse(value)
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const messages = err.errors
          .map((e) => `${e.path.join('.')} - ${e.message}`)
          .join(', ')

        throw new BadRequestException(`Validation failed: ${messages}`)
      } else {
        throw new BadRequestException('Unknown validation error')
      }
    }
  }
}
