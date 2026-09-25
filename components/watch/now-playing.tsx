"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Playlist, PlaylistVideo } from "@/lib/types";

export function NowPlaying({
  playlist,
  activeVideo,
  activeIndex,
  watched,
}: {
  playlist: Playlist;
  activeVideo: PlaylistVideo;
  activeIndex: number;
  watched: string[];
}) {
  const router = useRouter();
  const nextVideo =
    activeIndex + 1 < playlist.videos.length ? playlist.videos[activeIndex + 1] : undefined;
  const progress = playlist.videos.length
    ? Math.round((watched.length / playlist.videos.length) * 100)
    : 0;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border bg-black shadow-xl">
        <iframe
          key={activeVideo.videoId}
          className="aspect-video w-full"
          src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?rel=0&autoplay=0`}
          title={activeVideo.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          Lesson {activeIndex + 1} of {playlist.videos.length}
        </Badge>
        <Badge variant="secondary">{progress}% completed</Badge>
        {nextVideo && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => router.push(`/watch/${playlist.playlistId}/${nextVideo.videoId}`)}
          >
            Next lesson <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
      <h1 className="mt-3 text-xl font-extrabold leading-snug tracking-tight sm:text-2xl">
        {activeVideo.title}
      </h1>
      <p className="mt-1 text-sm font-medium text-muted-foreground">
        {playlist.channelTitle}
      </p>
      {activeVideo.description && (
        <Card className="mt-4">
          <CardContent className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-muted-foreground">
            {activeVideo.description.slice(0, 900)}
            {activeVideo.description.length > 900 ? "…" : ""}
          </CardContent>
        </Card>
      )}
    </>
  );
}
