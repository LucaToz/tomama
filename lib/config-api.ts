import type {
  AppConfig,
  AdminConfigResponse,
  PublicConfigResponse,
  UnlockedConfigResponse,
} from "./types";
import { pickVaultCopy } from "./copy";

export function toPublicConfig(config: AppConfig): PublicConfigResponse {
  return {
    unlocked: false,
    copy: pickVaultCopy(config.copy),
  };
}

export function toUnlockedConfig(config: AppConfig): UnlockedConfigResponse {
  return {
    unlocked: true,
    copy: config.copy,
    songs: config.songs,
  };
}

export function toAdminConfig(config: AppConfig): AdminConfigResponse {
  return {
    ...config,
    unlocked: true,
    admin: true,
  };
}
