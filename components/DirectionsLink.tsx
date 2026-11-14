"use client";

import { useSyncExternalStore } from "react";

/** iPhone, iPad, or an iPad that reports itself as a Mac. */
function isAppleMobile() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

const noop = () => () => {};

/**
 * Driving directions to a point. On iPhone/iPad this opens Apple Maps, which
 * hands turn-by-turn navigation straight to CarPlay when the phone is
 * connected; everywhere else it opens Google Maps (Android Auto picks that up).
 */
export default function DirectionsLink({
  lat,
  lng,
  className,
  children = "Get Directions",
}: {
  lat: number;
  lng: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const apple = useSyncExternalStore(noop, isAppleMobile, () => false);
  const href = apple
    ? `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}
