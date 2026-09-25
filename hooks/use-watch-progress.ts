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
}

const EMPTY: Progress = { watched: [], lastWatched: null };

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
  }, [playlistId]);

  const persist = useCallback(
    (next: Progress) => {
      progressRef.current = next;
      setWatched(next.watched);
      setLastWatched(next.lastWatched);
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
        watched: current.watched.includes(videoId)
          ? current.watched.filter((v) => v !== videoId)
          : [...current.watched, videoId],
        lastWatched: current.lastWatched,
      });
    },
    [persist]
  );

  return { watched, lastWatched, markWatched, toggleWatched };
}
