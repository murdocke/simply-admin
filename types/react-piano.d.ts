declare module "react-piano" {
  import type { ComponentType } from "react";

  export const MidiNumbers: {
    fromNote(note: string): number;
  };

  export interface PianoProps {
    noteRange: {
      first: number;
      last: number;
    };
    playNote: (midiNumber: number) => void;
    stopNote: (midiNumber: number) => void;
    activeNotes?: number[];
    keyboardShortcuts?: unknown[];
    width: number;
  }

  export const Piano: ComponentType<PianoProps>;
}
