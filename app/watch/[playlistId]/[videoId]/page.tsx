import type { Metadata } from "next";
import { WatchView } from "@/components/watch/watch-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playlistId: string; videoId: string }>;
}): Promise<Metadata> {
  const { playlistId } = await params;
  return { title: `Now playing · ${playlistId}` };
}

export default async function VideoWatchPage({
  params,
}: {
  params: Promise<{ playlistId: string; videoId: string }>;
}) {
  const { playlistId, videoId } = await params;
  return <WatchView playlistId={playlistId} activeVideoId={videoId} />;
}
