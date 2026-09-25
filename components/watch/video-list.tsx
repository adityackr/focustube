"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Circle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlaylistVideo } from "@/lib/types";

export function VideoList({
  videos,
  playlistId,
  channelTitle,
  activeVideoId,
  watched,
  onToggleWatched,
  compact = false,
}: {
  videos: PlaylistVideo[];
  playlistId: string;
  channelTitle: string;
  activeVideoId?: string;
  watched: string[];
  onToggleWatched: (videoId: string) => void;
  compact?: boolean;
}) {
  return (
    <ul className="space-y-1.5">
      {videos.map((video, i) => {
        const active = video.videoId === activeVideoId;
        const done = watched.includes(video.videoId);
        return (
          <li key={video.videoId}>
            <div
              className={cn(
                "group flex gap-3 rounded-xl border p-2 transition-all",
                active
                  ? "border-primary bg-primary/5 shadow-md"
                  : "hover:border-primary/40 hover:shadow-sm"
              )}
            >
              <Link
                href={`/watch/${playlistId}/${video.videoId}`}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span
                  className={cn(
                    "relative shrink-0 overflow-hidden rounded-lg",
                    compact ? "h-11 w-20" : "h-14 w-24"
                  )}
                >
                  <Image
                    src={video.thumbnail.url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 80px, 96px"
                    className="object-cover"
                  />
                  {active && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                      <Play className="size-5 fill-white text-white" />
                    </span>
                  )}
                  {!active && (
                    <span className="absolute bottom-1 left-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "line-clamp-2 text-[13px] font-semibold leading-snug",
                      active && "text-primary"
                    )}
                  >
                    {video.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {channelTitle}
                  </span>
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleWatched(video.videoId)}
                title={done ? "Mark as unwatched" : "Mark as watched"}
                aria-label={done ? "Mark as unwatched" : "Mark as watched"}
                className={cn(
                  "h-7 w-7 shrink-0 self-start",
                  done ? "text-green-500" : "text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
