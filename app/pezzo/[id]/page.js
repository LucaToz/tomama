import { redirect } from "next/navigation";
import { readConfig } from "@/lib/db";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const config = await readConfig();
  const song = config.songs?.find((s) => String(s.id) === String(id));

  if (!song) {
    return { title: "Tomama" };
  }

  const image = absoluteUrl(song.photo);
  const description = song.punchline || "Pezzi nuovi di Tomama";

  return {
    title: `Tomama — ${song.title}`,
    description,
    openGraph: {
      title: `Tomama — ${song.title}`,
      description,
      url: `${getSiteUrl()}/pezzo/${song.id}`,
      siteName: "Tomama",
      type: "website",
      images: image
        ? [{ url: image, width: 1200, height: 1200, alt: `Cover — ${song.title}` }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `Tomama — ${song.title}`,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function PezzoPage({ params }) {
  const { id } = await params;
  redirect(`/#pezzo-${id}`);
}
