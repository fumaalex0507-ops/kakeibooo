"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_LINKS } from "@/lib/navLinks";

const SWIPE_MIN_DISTANCE = 60; // px, minimum horizontal travel to count as a swipe
const SWIPE_MAX_OFF_AXIS = 75; // px, max vertical drift allowed (rejects scrolling)
const SWIPE_MAX_TIME = 600; // ms, max duration to still count as a swipe

/** Lets the whole viewport respond to a horizontal swipe by moving between
 * the pages listed in NAV_LINKS, in addition to tapping the nav tabs. */
export function SwipeNav() {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let tracking = false;

    function isInsideHorizontalScroller(node: EventTarget | null): boolean {
      let el = node instanceof HTMLElement ? node : null;
      while (el && el !== document.body) {
        if (el.scrollWidth > el.clientWidth + 1) {
          const overflowX = getComputedStyle(el).overflowX;
          if (overflowX === "auto" || overflowX === "scroll") return true;
        }
        el = el.parentElement;
      }
      return false;
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }
      // Don't hijack swipes meant to scroll a horizontally-scrollable area
      // (e.g. the transaction table).
      if (isInsideHorizontalScroller(event.target)) {
        tracking = false;
        return;
      }
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      tracking = true;
    }

    function onTouchEnd(event: TouchEvent) {
      if (!tracking) return;
      tracking = false;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const elapsed = Date.now() - startTime;

      if (
        elapsed > SWIPE_MAX_TIME ||
        Math.abs(deltaX) < SWIPE_MIN_DISTANCE ||
        Math.abs(deltaY) > SWIPE_MAX_OFF_AXIS
      ) {
        return;
      }

      const currentIndex = NAV_LINKS.findIndex((link) =>
        pathnameRef.current?.startsWith(link.href)
      );
      if (currentIndex === -1) return;

      // Swipe left -> next page, swipe right -> previous page.
      const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= NAV_LINKS.length) return;

      router.push(NAV_LINKS[nextIndex].href);
    }

    function onTouchCancel() {
      tracking = false;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [router]);

  return null;
}
