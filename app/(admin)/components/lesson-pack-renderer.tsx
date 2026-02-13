'use client';

import type { LessonPack, LessonPackSubject } from './lesson-pack-types';

type LessonPackRendererProps = {
  lessonPack: LessonPack;
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
      className="text-base text-[var(--c-3a3935)] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ));
};

const renderVideo = (url: string, title: string, height = 320) => {
  if (!url) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]">
      <iframe
        src={url}
        title={title}
        className="w-full"
        style={{ height: `${height}px` }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

const renderPdf = (url: string, title: string) => {
  if (!url) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]">
      <iframe src={url} title={title} className="h-[420px] w-full" />
    </div>
  );
};

const withQueryParam = (rawUrl: string, key: string, value: string) => {
  if (!rawUrl) return rawUrl;
  try {
    const next = new URL(rawUrl);
    next.searchParams.set(key, value);
    return next.toString();
  } catch {
    return rawUrl;
  }
};

const renderSoundSlice = (url: string, title: string, height = 675) => {
  if (!url) return null;
  const embedUrl = withQueryParam(url, 'keyboard', '1');
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]">
      <iframe
        src={embedUrl}
        title={title}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

const renderHeroMedia = (
  subject: LessonPackSubject,
  lessonTitle: string,
) => {
  if (subject.headerImageUrl) {
    return (
      <div className="overflow-hidden rounded-t-2xl border-b border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)]">
        <img
          src={subject.headerImageUrl}
          alt={subject.title || lessonTitle}
          className="h-56 w-full object-cover"
        />
      </div>
    );
  }
  if (subject.headerVideoUrl) {
    return (
      <div className="overflow-hidden rounded-t-2xl border-b border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]">
        <iframe
          src={subject.headerVideoUrl}
          title={subject.title || 'Header video'}
          className="h-56 w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (subject.soundSlicePlacement === 'header' && subject.soundSliceUrl) {
    const embedUrl = withQueryParam(subject.soundSliceUrl, 'keyboard', '1');
    return (
      <div className="overflow-hidden rounded-t-2xl border-b border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]">
        <iframe
          src={embedUrl}
          title={subject.title || 'SoundSlice'}
          className="h-[420px] w-full"
        />
      </div>
    );
  }
  return null;
};

const renderLinks = (links: LessonPackSubject['links']) => {
  const validLinks = links.filter(link => link.url.trim());
  if (!validLinks.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {validLinks.map((link, index) => (
        <a
          key={`${link.url}-${index}`}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
        >
          {link.label?.trim() || 'Open link'}
        </a>
      ))}
    </div>
  );
};

export default function LessonPackRenderer({ lessonPack }: LessonPackRendererProps) {
  const subjectCount = lessonPack.subjectCount ?? lessonPack.subjects.length;
  const subjects = [...lessonPack.subjects]
    .sort((a, b) => a.order - b.order)
    .slice(0, subjectCount);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-efece6)]">
        {lessonPack.coverImage ? (
          <div className="relative overflow-hidden rounded-2xl bg-[var(--c-f1f1ef)]">
            <img
              src={lessonPack.coverImage}
              alt={lessonPack.title}
              className="h-[360px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/20 bg-white/15 px-5 py-4 backdrop-blur-md">
              <h1 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {lessonPack.title}
              </h1>
              {lessonPack.subtitle ? (
                <p className="mt-2 text-sm text-[var(--c-3a3935)]">
                  {lessonPack.subtitle}
                </p>
              ) : null}
              {lessonPack.description ? (
                <p className="mt-3 text-sm text-[var(--c-3a3935)]">
                  {lessonPack.description}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="px-5 py-5">
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
        )}
      </div>

      <div className="space-y-6">
        {subjects.map((subject, index) => (
          <section
            key={subject.id}
            className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-efece6)] shadow-sm"
          >
            {renderHeroMedia(subject, lessonPack.title) ? (
              <div className="w-full">
                {renderHeroMedia(subject, lessonPack.title)}
              </div>
            ) : null}
            <div className="space-y-4 p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Lesson Subject {index + 1}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
                {subject.title?.trim() || 'Lesson Subject'}
              </h2>
            </div>
            <div className="space-y-4 px-5 pb-5">
              {subject.soundSlicePlacement === 'body'
                ? renderSoundSlice(
                    subject.soundSliceUrl,
                    subject.title || 'SoundSlice',
                  )
                : null}

              {subject.body?.trim() ? (
                <div className="space-y-3">{renderMarkdown(subject.body)}</div>
              ) : null}

              {renderVideo(
                subject.inlineVideoUrl,
                subject.title || 'Inline video',
              )}

              {renderPdf(
                subject.inlinePdfUrl,
                subject.title || 'Inline PDF',
              )}

              {renderLinks(subject.links)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
