"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/store/library";
import { useWatchProgress } from "@/hooks/use-watch-progress";
import { VideoList } from "@/components/watch/video-list";
import { WatchSkeleton } from "@/components/watch/watch-skeleton";
import { WatchTopbar } from "@/components/watch/watch-topbar";
import { NowPlaying } from "@/components/watch/now-playing";
import { PlaylistOverview } from "@/components/watch/playlist-overview";
import { LessonSidebar } from "@/components/watch/lesson-sidebar";
import { PlaylistNotFound } from "@/components/watch/playlist-not-found";

export function WatchView({
  playlistId,
  activeVideoId,
}: {
  playlistId: string;
  activeVideoId?: string;
}) {
  const router = useRouter();
  const playlists = useLibrary((s) => s.playlists);
  const fetchPlaylist = useLibrary((s) => s.fetchPlaylist);
  const loadingIds = useLibrary((s) => s.loadingIds);
  const hydrated = useLibrary((s) => s.hydrated);
  const pushRecent = useLibrary((s) => s.pushRecent);

  const playlist = playlists[playlistId];
  const loading = loadingIds.includes(playlistId);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { watched, markWatched, toggleWatched } = useWatchProgress(playlistId);

  // Auto-import when opening a shared link for a playlist not in the library.
  // Wait for hydration first so we don't re-fetch something already in localStorage.
  useEffect(() => {
    if (hydrated && !playlist && !loading) fetchPlaylist(playlistId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId, hydrated]);

  useEffect(() => {
    if (playlist) pushRecent(playlistId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId, !!playlist]);

  useEffect(() => {
    if (activeVideoId) markWatched(activeVideoId);
  }, [activeVideoId, markWatched]);

  if (!playlist) {
    if (!hydrated || loading) return <WatchSkeleton />;
    return <PlaylistNotFound />;
  }

  const activeIndex = activeVideoId
    ? playlist.videos.findIndex((v) => v.videoId === activeVideoId)
    : -1;
  const activeVideo = activeIndex >= 0 ? playlist.videos[activeIndex] : undefined;

  return (
    <div className="mx-auto max-w-350 px-4 py-4 sm:px-6 lg:py-6">
      <WatchTopbar
        playlistId={playlistId}
        playlistTitle={playlist.playlistTitle}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div
        className={cn(
          "grid gap-6",
          sidebarOpen ? "lg:grid-cols-[minmax(0,1fr)_380px]" : "lg:grid-cols-1"
        )}
      >
        <div className="min-w-0">
          {activeVideo ? (
            <NowPlaying
              playlist={playlist}
              activeVideo={activeVideo}
              activeIndex={activeIndex}
              watched={watched}
            />
          ) : (
            <PlaylistOverview
              playlist={playlist}
              onStart={(videoId) => router.push(`/watch/${playlistId}/${videoId}`)}
            />
          )}
        </div>

        <LessonSidebar
          playlist={playlist}
          playlistId={playlistId}
          activeVideoId={activeVideoId}
          watched={watched}
          onToggleWatched={toggleWatched}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />
      </div>

      <Separator className="my-8" />

      {/* Mobile lesson list (always visible below on small screens) */}
      <div className="lg:hidden">
        <h2 className="mb-3 font-bold">All lessons</h2>
        <VideoList
          videos={playlist.videos}
          playlistId={playlistId}
          channelTitle={playlist.channelTitle}
          activeVideoId={activeVideoId}
          watched={watched}
          onToggleWatched={toggleWatched}
          compact
        />
      </div>
    </div>
  );
}
