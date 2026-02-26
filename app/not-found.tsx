"use client";

import MidiPlayground from "@/app/components/midi-playground";

export default function NotFound() {
  return (
    <MidiPlayground showDoneLink doneHref="/simplymusic" showNotFoundBadge />
  );
}
