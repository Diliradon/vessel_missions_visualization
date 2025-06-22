import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const env = createEnv({
  server: {
    MONGODB_URI: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string(),
  },
  runtimeEnv: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});

export { env };
