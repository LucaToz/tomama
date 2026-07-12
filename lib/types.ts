export interface Song {
  id: number;
  title: string;
  photo: string | null;
  photos: string[];
  punchline: string;
  lyrics: string;
  audioSrc: string | null;
  duration: string;
  /** @deprecated legacy — migrato in photos[] */
  photo2?: string;
}

export interface CopyConfig {
  vaultEyebrow: string;
  vaultSub: string;
  vaultPlaceholder: string;
  vaultButton: string;
  vaultError: string;
  diaryStamp: string;
  diaryBand: string;
  diarySub: string;
  diaryFooter: string;
  instagramUrl: string;
  spotifyUrl: string;
  playlistTitle: string;
  loadingText: string;
}

export type VaultCopy = Pick<
  CopyConfig,
  | "vaultEyebrow"
  | "vaultSub"
  | "vaultPlaceholder"
  | "vaultButton"
  | "vaultError"
  | "loadingText"
>;

export interface AppConfig {
  vaultCode: string;
  copy: CopyConfig;
  songs: Song[];
}

export interface PublicConfigResponse {
  unlocked: false;
  copy: VaultCopy;
}

export interface UnlockedConfigResponse {
  unlocked: true;
  copy: CopyConfig;
  songs: Song[];
}

export interface AdminConfigResponse extends AppConfig {
  unlocked: true;
  admin: true;
}

export type ConfigResponse =
  | PublicConfigResponse
  | UnlockedConfigResponse
  | AdminConfigResponse;

export interface SaveStatus {
  success: boolean | null;
  message: string;
}

export interface UploadState {
  songId: number | null;
  field: string | null;
}
