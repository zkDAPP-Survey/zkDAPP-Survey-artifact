import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsStringRecord(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isStringRecord',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return false;
          }

          return Object.values(value as Record<string, unknown>).every(
            (entry) => typeof entry === 'string',
          );
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be an object with string values`;
        },
      },
    });
  };
}
