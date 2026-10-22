import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("127.0.0.1"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  CAPABILITY_SECRET: z.string().min(32, "CAPABILITY_SECRET must be at least 32 characters long"),
  BEDROCK_ENABLED: z.enum(["true", "false"]).transform((v) => v === "true").default("false"),
  AWS_REGION: z.string().default("us-east-1"),
  BEDROCK_GUARDRAIL_ID: z.string().optional().default(""),
  BEDROCK_GUARDRAIL_VERSION: z.string().default("DRAFT"),
  DATABASE_PATH: z.string().default("./data/sentinelmcp.db"),
});

export type Config = z.infer<typeof ConfigSchema>;

let parsedConfig: Config;

try {
  parsedConfig = ConfigSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Configuration validation failed:");
    console.error(JSON.stringify(error.format(), null, 2));
  } else {
    console.error("Failed to parse configuration:", error);
  }
  process.exit(1);
}

export const config = parsedConfig;