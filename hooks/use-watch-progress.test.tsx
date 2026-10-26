import { describe, expect, test, beforeEach } from "bun:test";
import React, { useEffect } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useWatchProgress } from "./use-watch-progress";

const KEY = "focustube:progress:P1";
const LEGACY_KEY = "clean-youtube:progress:P1";

function read() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Mimics WatchView: auto-marks the open video, exposes a toggle button. */
function Harness({
  activeVideoId,
  toggleId,
  toggleChapterKey,
}: {
  activeVideoId?: string;
  toggleId?: string;
  toggleChapterKey?: string;
}) {
  const { watched, completedChapters, markWatched, toggleWatched, toggleChapter } =
    useWatchProgress("P1");
  useEffect(() => {
    if (activeVideoId) markWatched(activeVideoId);
  }, [activeVideoId, markWatched]);
  return (
    <div>
      <span data-testid="watched">{watched.join(",")}</span>
      <span data-testid="chapters">{completedChapters.join(",")}</span>
      {toggleId && (
        <button data-testid="toggle" onClick={() => toggleWatched(toggleId)}>
          toggle
        </button>
      )}
      {toggleChapterKey && (
        <button data-testid="toggle-chapter" onClick={() => toggleChapter(toggleChapterKey)}>
          toggle chapter
        </button>
      )}
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("useWatchProgress", () => {
  test("mounting a video merges with stored progress (no wipe)", () => {
    localStorage.setItem(KEY, JSON.stringify({ watched: ["A"], lastWatched: "A" }));
    let unmount!: () => void;
    act(() => {
      ({ unmount } = render(<Harness activeVideoId="B" />));
    });
    expect(read()).toEqual({ watched: ["A", "B"], lastWatched: "B", completedChapters: [] });
    expect(screen.getByTestId("watched").textContent).toBe("A,B");
    unmount();
  });

  test("reported scenario: watch A -> next video B -> refresh keeps everything", () => {
    // 1. Open video A (opening auto-marks it watched, like WatchView does)
    let unmount!: () => void;
    act(() => {
      ({ unmount } = render(<Harness activeVideoId="A" />));
    });
    expect(read().watched).toEqual(["A"]);
    unmount();

    // 2. Navigate to video B (client-side nav, fresh mount like a new page load)
    act(() => {
      ({ unmount } = render(<Harness activeVideoId="B" />));
    });
    expect(read()).toEqual({ watched: ["A", "B"], lastWatched: "B", completedChapters: [] });
    unmount();

    // 3. Refresh on video B
    act(() => {
      ({ unmount } = render(<Harness activeVideoId="B" />));
    });
    expect(read()).toEqual({ watched: ["A", "B"], lastWatched: "B", completedChapters: [] });
    expect(screen.getByTestId("watched").textContent).toBe("A,B");
    unmount();
  });

  test("adopts progress saved under the legacy Clean YouTube key", () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({ watched: ["A", "B"], lastWatched: "B" })
    );
    let unmount!: () => void;
    act(() => {
      ({ unmount } = render(<Harness />));
    });
    expect(screen.getByTestId("watched").textContent).toBe("A,B");
    expect(JSON.parse(localStorage.getItem(KEY)!).watched).toEqual(["A", "B"]);
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    unmount();
  });

  test("toggling a list video on persists across refresh", () => {
    let unmount!: () => void;
    act(() => {
      ({ unmount } = render(<Harness toggleId="C" />));
    });
    act(() => {
      fireEvent.click(screen.getByTestId("toggle"));
    });
    expect(read().watched).toEqual(["C"]);
    unmount();

    // refresh
    act(() => {
      ({ unmount } = render(<Harness />));
    });
    expect(read().watched).toEqual(["C"]);
    expect(screen.getByTestId("watched").textContent).toBe("C");
    unmount();
  });

  test("toggle off removes the video but keeps the rest", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ watched: ["A", "B"], lastWatched: "B" })
    );
    let unmount!: () => void;
    act(() => {
      ({ unmount } = render(<Harness toggleId="A" />));
    });
    act(() => {
      fireEvent.click(screen.getByTestId("toggle"));
    });
    expect(read().watched).toEqual(["B"]);
    unmount();
  });

  test("chapter completion toggles on, survives refresh, and toggles off", () => {
    const KEY_A = "vid-a@0";
    let unmount!: () => void;
    act(() => {
      ({ unmount } = render(<Harness toggleChapterKey={KEY_A} />));
    });
    expect(screen.getByTestId("chapters").textContent).toBe("");

    act(() => {
      fireEvent.click(screen.getByTestId("toggle-chapter"));
    });
    expect(read().completedChapters).toEqual([KEY_A]);
    expect(screen.getByTestId("chapters").textContent).toBe(KEY_A);
    unmount();

    // refresh — the mark must not be wiped by the mount-time auto-mark
    act(() => {
      ({ unmount } = render(<Harness toggleChapterKey={KEY_A} />));
    });
    expect(screen.getByTestId("chapters").textContent).toBe(KEY_A);

    act(() => {
      fireEvent.click(screen.getByTestId("toggle-chapter"));
    });
    expect(read().completedChapters).toEqual([]);
    expect(screen.getByTestId("chapters").textContent).toBe("");
    unmount();
  });

  test("marking a video watched keeps chapter completion (no clobber)", () => {
    const KEY_A = "vid-a@0";
    localStorage.setItem(
      KEY,
      JSON.stringify({ watched: ["A"], lastWatched: "A", completedChapters: [KEY_A] })
    );
    let unmount!: () => void;
    act(() => {
      ({ unmount } = render(<Harness activeVideoId="B" />));
    });
    expect(read()).toEqual({
      watched: ["A", "B"],
      lastWatched: "B",
      completedChapters: [KEY_A],
    });
    expect(screen.getByTestId("chapters").textContent).toBe(KEY_A);
    unmount();
  });
});
