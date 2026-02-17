import { getDb } from './db';

export type LessonTypes = string[];
export type LessonSections = Record<string, unknown>;
export type LessonMaterials = Record<string, string[]>;
export type LessonParts = Record<string, string[]>;

export const getLessonTypes = (): LessonTypes => {
  const db = getDb();
  const rows = db
    .prepare('SELECT name FROM lesson_types ORDER BY sort_order ASC')
    .all() as Array<{ name: string }>;
  return rows.map(row => row.name);
};

export const getLessonSections = (): LessonSections => {
  const db = getDb();
  const rows = db
    .prepare('SELECT program, sections_json FROM lesson_sections')
    .all() as Array<{ program: string; sections_json: string | null }>;
  const sections: Record<string, unknown> = {};
  rows.forEach(row => {
    sections[row.program] = row.sections_json
      ? (JSON.parse(row.sections_json) as unknown)
      : [];
  });
  return sections;
};

export const getLessonMaterials = (): LessonMaterials => {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT program, section, material_order, title
        FROM lesson_materials
        ORDER BY program ASC, section ASC, material_order ASC
      `,
    )
    .all() as Array<{
    program: string;
    section: string;
    material_order: number;
    title: string | null;
  }>;
  const materials: Record<string, string[]> = {};
  rows.forEach(row => {
    const key = `${row.program}|${row.section}`;
    if (!materials[key]) materials[key] = [];
    materials[key][row.material_order] = row.title ?? '';
  });
  return materials;
};

export const getLessonParts = (): LessonParts => {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT material_code, part_order, title
        FROM lesson_parts
        ORDER BY material_code ASC, part_order ASC
      `,
    )
    .all() as Array<{ material_code: string; part_order: number; title: string | null }>;
  const parts: Record<string, string[]> = {};
  rows.forEach(row => {
    if (!parts[row.material_code]) parts[row.material_code] = [];
    parts[row.material_code][row.part_order] = row.title ?? '';
  });
  return parts;
};
