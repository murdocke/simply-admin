import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const MIDI_EXTENSIONS = new Set([".mid", ".midi"]);

export async function GET() {
  try {
    const midiDir = path.join(process.cwd(), "public", "midi-lessons");
    const entries = await fs.readdir(midiDir, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => MIDI_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
    return NextResponse.json({
      files: files.map((name) => ({
        name,
        title: name
          .replace(/\.[^.]+$/, "")
          .replace(/-/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase(),
        url: `/midi-lessons/${encodeURIComponent(name)}`,
      })),
    });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "ENOENT") {
      return NextResponse.json({ files: [] });
    }
    return NextResponse.json(
      { files: [], error: "Failed to list MIDI lessons." },
      { status: 500 },
    );
  }
}
