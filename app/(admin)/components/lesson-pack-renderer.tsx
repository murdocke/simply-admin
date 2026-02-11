'use client';

import Link from 'next/link';
import type {
  LessonPack,
  LessonPackAudience,
  LessonPackBlock,
} from './lesson-pack-types';

type LessonPackRendererProps = {
  lessonPack: LessonPack;
  audience: LessonPackAudience;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderMarkdown = (markdown: string) => {
  const safe = escapeHtml(markdown);
  const paragraphs = safe.split(/\n{2,}/g).map(block =>
    block.replace(/\n/g, '<br />'),
  );
  return paragraphs.map((html, index) => (
    <p
      key={`md-${index}`}
      className="text-sm text-[var(--c-3a3935)] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ));
};

const shouldRenderBlock = (block: LessonPackBlock, audience: LessonPackAudience) =>
  block.visibility === 'both' || block.visibility === audience;

export default function LessonPackRenderer({
  lessonPack,
  audience,
}: LessonPackRendererProps) {
  const blocks = [...lessonPack.blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-5">
      {lessonPack.coverImage ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)]">
          <img
            src={lessonPack.coverImage}
            alt={lessonPack.title}
            className="h-48 w-full object-cover"
          />
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
          {lessonPack.title}
        </h1>
        {lessonPack.subtitle ? (
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            {lessonPack.subtitle}
          </p>
        ) : null}
        {lessonPack.description ? (
          <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
            {lessonPack.description}
          </p>
        ) : null}
      </div>

      {blocks
        .filter(block => shouldRenderBlock(block, audience))
        .map(block => {
          switch (block.type) {
            case 'heading': {
              const { text, level } = block.data as {
                text?: string;
                level?: number;
              };
              const Tag = (`h${Math.min(4, Math.max(1, level ?? 2))}` ??
                'h2') as keyof JSX.IntrinsicElements;
              return (
                <Tag
                  key={block.id}
                  className="text-xl font-semibold text-[var(--c-1f1f1d)]"
                >
                  {text ?? 'Heading'}
                </Tag>
              );
            }
            case 'richText': {
              const { markdown } = block.data as { markdown?: string };
              return (
                <div key={block.id} className="space-y-3">
                  {renderMarkdown(markdown ?? '')}
                </div>
              );
            }
            case 'image': {
              const { uri, caption, alt } = block.data as {
                uri?: string;
                caption?: string;
                alt?: string;
              };
              if (!uri) return null;
              return (
                <figure key={block.id} className="space-y-2">
                  <div className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)]">
                    <img
                      src={uri}
                      alt={alt ?? 'Lesson pack image'}
                      className="h-56 w-full object-cover"
                    />
                  </div>
                  {caption ? (
                    <figcaption className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      {caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            }
            case 'pdf': {
              const { uri, title, displayMode } = block.data as {
                uri?: string;
                title?: string;
                displayMode?: 'inline' | 'link';
              };
              if (!uri) return null;
              return (
                <div key={block.id} className="space-y-2">
                  {title ? (
                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      {title}
                    </p>
                  ) : null}
                  {displayMode === 'link' ? (
                    <a
                      href={uri}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                    >
                      Open PDF
                    </a>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]">
                      <iframe
                        src={uri}
                        title={title ?? 'PDF preview'}
                        className="h-[420px] w-full"
                      />
                    </div>
                  )}
                </div>
              );
            }
            case 'soundSlice': {
              const { url, title, height } = block.data as {
                url?: string;
                title?: string;
                height?: number;
              };
              if (!url) return null;
              return (
                <div key={block.id} className="space-y-2">
                  {title ? (
                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      {title}
                    </p>
                  ) : null}
                  <div className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]">
                    <iframe
                      src={url}
                      title={title ?? 'SoundSlice embed'}
                      className="w-full"
                      style={{ height: `${height ?? 360}px` }}
                    />
                  </div>
                </div>
              );
            }
            case 'linkExternal': {
              const { label, url } = block.data as {
                label?: string;
                url?: string;
              };
              if (!url) return null;
              return (
                <a
                  key={block.id}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                >
                  {label ?? 'Open link'}
                </a>
              );
            }
            case 'linkInternal': {
              const { label, route } = block.data as {
                label?: string;
                route?: string;
              };
              if (!route) return null;
              return (
                <Link
                  key={block.id}
                  href={route}
                  className="inline-flex items-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                >
                  {label ?? 'Open'}
                </Link>
              );
            }
            default:
              return null;
          }
        })}
    </div>
  );
}
