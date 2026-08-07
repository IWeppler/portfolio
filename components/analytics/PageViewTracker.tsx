"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type PageViewTrackerProps = {
  projectId?: string;
};

type WindowWithIdleCallback = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: () => void) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

export function PageViewTracker({ projectId }: PageViewTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const controller = new AbortController();
    const windowWithIdleCallback = window as WindowWithIdleCallback;

    const track = () => {
      fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer,
          projectId,
        }),
        keepalive: true,
        signal: controller.signal,
      }).catch(() => {
        // Analytics should never interrupt the visitor experience.
      });
    };

    const idleCallbackId = windowWithIdleCallback.requestIdleCallback
      ? windowWithIdleCallback.requestIdleCallback(track)
      : window.setTimeout(track, 0);

    return () => {
      controller.abort();

      if (windowWithIdleCallback.cancelIdleCallback) {
        windowWithIdleCallback.cancelIdleCallback(idleCallbackId);
      } else {
        window.clearTimeout(idleCallbackId);
      }
    };
  }, [pathname, projectId]);

  return null;
}
