import { z } from 'zod';

export const ExampleSchema = z.object({
  message: z.string(),
});

export type ExampleType = z.infer<typeof ExampleSchema>;

export const sayHello = () => "Hello from Shared Package!";