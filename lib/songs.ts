import type { Song } from "./types";

export const VAULT_CODE = "TOMAMA";
export const MAX_EXTRA_PHOTOS = 3;

export function getSongPhotos(song: Partial<Song> | null | undefined): string[] {
  if (Array.isArray(song?.photos)) {
    return song.photos.filter(Boolean).slice(0, MAX_EXTRA_PHOTOS);
  }
  if (song?.photo2) return [song.photo2];
  return [];
}

export function normalizeSong(song: Song & { photo2?: string }): Song {
  const { photo2, ...rest } = song;
  void photo2;
  return {
    ...rest,
    photos: getSongPhotos(song),
  };
}

export function createEmptySong(id: number): Song {
  return {
    id,
    title: `Pezzo ${id}`,
    photo: null,
    photos: [],
    punchline: "",
    lyrics: "",
    audioSrc: null,
    duration: "—:—",
  };
}

export const SONGS: Song[] = [
  {
    id: 1,
    title: "Antologia Rurale",
    photo: "/songs/song1.jpg",
    photos: ["/songs/song1.jpg"],
    punchline: "lavorare tanto, sognare il giusto",
    lyrics:
      "Prima strofa del pezzo qui.\nSeconda riga che continua il discorso.\n\nRitornello che urli con noi,\ntre accordi e via, non serve altro.\n\nIncolla qui il testo completo quando è pronto.",
    audioSrc: null,
    duration: "—:—",
  },
  ...Array.from({ length: 8 }, (_, i) => createEmptySong(i + 2)).map((song) => ({
    ...song,
    title: `Pezzo ${song.id} — TITOLO QUI`,
    punchline: "PUNCHLINE QUI",
    lyrics: "TESTO COMPLETO QUI.",
  })),
];
