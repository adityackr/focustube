"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function keyFor(playlistId: string) {
  return `focustube:progress:${playlistId}`;
}

function legacyKeyFor(playlistId: string) {
  return `clean-youtube:progress:${playlistId}`;
}

interface Progress {
  watched: string[];
  lastWatched: string | null;
  /** Chapter completion keys (`chapterKey(videoId, startSeconds)`). */
  completedChapters: string[];
}

const EMPTY: Progress = { watched: [], lastWatched: null, completedChapters: [] };

function readStored(playlistId: string): Progress {
  try {
    // One-time upgrade: adopt progress saved under the old Clean YouTube key.
    let raw = localStorage.getItem(keyFor(playlistId));
    if (!raw) {
      const legacy = localStorage.getItem(legacyKeyFor(playlistId));
      if (legacy) {
        localStorage.setItem(keyFor(playlistId), legacy);
        localStorage.removeItem(legacyKeyFor(playlistId));
        raw = legacy;
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Progress>;
      return {
        watched: Array.isArray(parsed.watched) ? parsed.watched : [],
        lastWatched: parsed.lastWatched ?? null,
        completedChapters: Array.isArray(parsed.completedChapters)
          ? parsed.completedChapters
          : [],
      };
    }
  } catch {
    /* corrupted JSON or storage unavailable */
  }
  return { ...EMPTY };
}

export function useWatchProgress(playlistId: string) {
  const [watched, setWatched] = useState<string[]>([]);
  const [lastWatched, setLastWatched] = useState<string | null>(null);
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);
  // Ref mirror of the progress. State updates are async, so a `markWatched`
  // call in a mount effect would otherwise close over the initial empty
  // array and overwrite (wipe) the stored list. Mutations always go through
  // the ref, which the load effect below populates synchronously first.
  const progressRef = useRef<Progress>({ ...EMPTY });

  useEffect(() => {
    const stored = readStored(playlistId);
    progressRef.current = stored;
    setWatched(stored.watched);
    setLastWatched(stored.lastWatched);
    setCompletedChapters(stored.completedChapters);
  }, [playlistId]);

  const persist = useCallback(
    (next: Progress) => {
      progressRef.current = next;
      setWatched(next.watched);
      setLastWatched(next.lastWatched);
      setCompletedChapters(next.completedChapters);
      try {
        localStorage.setItem(keyFor(playlistId), JSON.stringify(next));
      } catch {
        /* storage full / unavailable */
      }
    },
    [playlistId]
  );

  const markWatched = useCallback(
    (videoId: string) => {
      const current = progressRef.current;
      persist({
        ...current,
        watched: current.watched.includes(videoId)
          ? current.watched
          : [...current.watched, videoId],
        lastWatched: videoId,
      });
    },
    [persist]
  );

  const toggleWatched = useCallback(
    (videoId: string) => {
      const current = progressRef.current;
      persist({
        ...current,
        watched: current.watched.includes(videoId)
          ? current.watched.filter((v) => v !== videoId)
          : [...current.watched, videoId],
      });
    },
    [persist]
  );

  /** Flip a chapter's manual completed mark (`chapterKey(videoId, start)`). */
  const toggleChapter = useCallback(
    (key: string) => {
      const current = progressRef.current;
      persist({
        ...current,
        completedChapters: current.completedChapters.includes(key)
          ? current.completedChapters.filter((k) => k !== key)
          : [...current.completedChapters, key],
      });
    },
    [persist]
  );

  return { watched, lastWatched, completedChapters, markWatched, toggleWatched, toggleChapter };
}
