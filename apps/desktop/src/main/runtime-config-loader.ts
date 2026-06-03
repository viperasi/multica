import { app } from "electron";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import {
  DEFAULT_RUNTIME_CONFIG,
  parseRuntimeConfig,
  runtimeConfigFromDevEnv,
  serializeRuntimeConfig,
  type RuntimeConfig,
  type RuntimeConfigEnv,
  type RuntimeConfigResult,
} from "../shared/runtime-config";

export async function loadRuntimeConfig(options: {
  isDev: boolean;
  env: RuntimeConfigEnv;
  configPath?: string;
}): Promise<RuntimeConfigResult> {
  const configPath = options.configPath ?? desktopConfigPath();

  // Try reading desktop.json first — applies in both dev and production.
  // If the file exists and is valid, it takes priority over env defaults.
  try {
    const raw = await readFile(configPath, "utf-8");
    return { ok: true, config: parseRuntimeConfig(raw) };
  } catch (err) {
    if (!isMissingFileError(err)) {
      return {
        ok: false,
        error: {
          message: `Invalid ${configPath}: ${errorMessage(err)}`,
        },
      };
    }
    // File doesn't exist — fall through to defaults below.
  }

  // No desktop.json found: use env-based defaults in dev, cloud defaults in prod.
  if (options.isDev) {
    try {
      return { ok: true, config: runtimeConfigFromDevEnv(options.env) };
    } catch (err) {
      return { ok: false, error: { message: errorMessage(err) } };
    }
  }

  return { ok: true, config: { ...DEFAULT_RUNTIME_CONFIG } };
}

export function desktopConfigPath(): string {
  return join(app.getPath("home"), ".multica", "desktop.json");
}

export async function saveRuntimeConfig(config: RuntimeConfig): Promise<void> {
  const configPath = desktopConfigPath();
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, serializeRuntimeConfig(config), "utf-8");
}

function isMissingFileError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT",
  );
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export type { RuntimeConfig, RuntimeConfigResult };
