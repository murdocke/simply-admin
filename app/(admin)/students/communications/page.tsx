'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  COMMUNICATIONS_UPDATE_EVENT,
  readCommunications,
  type CommunicationEntry,
} from '../../components/communications-store';

const COMMUNICATIONS_SEEN_KEY = 'sm_communications_last_seen';

const sampleReactions = [
  {
    label: 'Love',
    count: 19,
    active: true,
    bg: 'bg-rose-400',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.8 4.6c-1.5-1.6-4-1.6-5.6 0L12 7.7 8.8 4.6c-1.5-1.6-4-1.6-5.6 0-1.7 1.7-1.7 4.3 0 6l8.8 8.9 8.8-8.9c1.7-1.7 1.7-4.3 0-6z" />
      </svg>
    ),
  },
  {
    label: 'Helpful',
    count: 16,
    active: false,
    bg: 'bg-sky-400',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 5v14" />
        <path d="M18 11l-6-6-6 6" />
      </svg>
    ),
  },
  {
    label: 'Inspired',
    count: 13,
    active: true,
    bg: 'bg-amber-400',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2l3 7h7l-5.5 4.3L18.5 21 12 16.8 5.5 21l2-7.7L2 9h7z" />
      </svg>
    ),
  },
];
const sampleCommentsByIndex: Record<number, { name: string; message: string }[]> =
  {
    0: [
      {
        name: 'Ava Chen',
        message:
          'Loved the walkthrough today — the new practice plan makes everything click.',
      },
      {
        name: 'Miles Rivera',
        message:
          'Thanks for the extra reminder. The video clip was super helpful.',
      },
      {
        name: 'Nora Patel',
        message:
          'I shared this with my parents and we are excited for next week!',
      },
    ],
    1: [
      {
        name: 'Jonah Brooks',
        message:
          'Can we get the sheet link again? I want to practice the bridge.',
      },
      {
        name: 'Sofia Kim',
        message:
          'The tempo tip totally helped — I hit my goal today.',
      },
    ],
    2: [
      {
        name: 'Elena Park',
        message:
          'Love how these updates keep us on track between lessons.',
      },
      {
        name: 'Caleb Diaz',
        message:
          'Thanks for calling out the showcase piece. I am ready for it.',
      },
    ],
  };

export default function StudentCommunicationsPage() {
  const [entries, setEntries] = useState<CommunicationEntry[]>([]);
  const [showAllPrevious, setShowAllPrevious] = useState(false);
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      const list = await readCommunications();
      if (!isActive) return;
      setEntries(list);
      if (list[0]) {
        window.localStorage.setItem(COMMUNICATIONS_SEEN_KEY, list[0].createdAt);
      }
    };
    void load();
    const handleUpdate = () => {
      void load();
    };
    window.addEventListener(COMMUNICATIONS_UPDATE_EVENT, handleUpdate);
    return () => {
      isActive = false;
      window.removeEventListener(COMMUNICATIONS_UPDATE_EVENT, handleUpdate);
    };
  }, []);

  const latestPosts = useMemo(() => entries.slice(0, 8), [entries]);
  const previousPosts = useMemo(() => {
    if (entries.length <= 8) return [];
    if (showAllPrevious) return entries.slice(8);
    return entries.slice(8, 20);
  }, [entries, showAllPrevious]);
  const hasMorePrevious = entries.length > 20;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Students
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Communications
          </h1>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Studio announcements, reminders, and shared resources.
          </p>
        </div>
        <Link
          href="/students/dashboard"
          className="inline-flex items-center justify-center rounded-full border border-[var(--c-e5e3dd)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
        >
          Back to dashboard
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="space-y-4">
          {latestPosts.length === 0 ? (
            <div className="w-full rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-sm text-[var(--c-6f6c65)]">
              Nothing posted yet.
            </div>
          ) : (
            latestPosts.map((entry, index) => {
              const isShowcase =
                entry.title === 'Piano Showcase Highlight - Halloween Showcase';
              const comments = sampleCommentsByIndex[index] ?? [];
              const isExpanded = expandedComments[entry.id] ?? false;
              const visibleComments = isExpanded
                ? comments
                : comments.slice(0, 3);
              const hasMoreComments = comments.length > 3;
              const seededFallback = (() => {
                if (!entry.id) return null;
                const seed =
                  entry.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 13;
                return {
                  love: 17 + (seed % 9),
                  helpful: 13 + ((seed * 2) % 8),
                  inspired: 14 + ((seed * 3) % 7),
                  reactions: 47 + ((seed * 4) % 16),
                  comments: 6 + (seed % 6),
                  views: 58 + ((seed * 5) % 28),
                };
              })();
              return (
              <article
                key={entry.id}
                className="w-full overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm"
              >
                {entry.mediaType && entry.mediaType !== 'none' ? (
                  <div className="w-full">
                    {entry.mediaType === 'image' ? (
                      <div className="relative">
                        <img
                          src={entry.mediaUrl}
                          alt={entry.title}
                          className={`w-full object-cover ${index === 0 ? 'h-72' : 'h-48'}`}
                        />
                        {isShowcase ? (
                          <>
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.6))]" />
                            <div className="absolute bottom-4 left-5 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[15px] uppercase tracking-[0.25em] text-white/85">
                              Play Video
                            </div>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                    {entry.mediaType === 'video' ? (
                      <video
                        src={entry.mediaUrl}
                        controls
                        className={`w-full object-cover ${index === 0 ? 'h-72' : 'h-48'}`}
                      />
                    ) : null}
                    {entry.mediaType === 'pdf' ? (
                      <div className="p-4 text-sm text-[var(--c-6f6c65)]">
                        <a
                          href={entry.mediaUrl}
                          className="font-semibold text-[var(--c-c8102e)] underline underline-offset-4"
                        >
                          View PDF attachment
                        </a>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xl font-semibold text-[var(--c-1f1f1d)]">
                      {entry.title}
                    </p>
                    <span className="text-base uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }).format(new Date(entry.createdAt))}
                    </span>
                  </div>
                  <p className="mt-3 text-base text-[var(--c-6f6c65)] whitespace-pre-line">
                    {entry.body}
                  </p>
                  <div className="mt-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                    {sampleReactions.map(reaction => (
                      <button
                        key={reaction.label}
                        type="button"
                        aria-label={reaction.label}
                        className={`relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition group ${
                          reaction.bg
                        } ${
                          reaction.active
                            ? 'ring-2 ring-white/70'
                              : 'opacity-90 hover:opacity-100'
                          }`}
                        >
                          <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)]/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-1f1f1d)] shadow-lg backdrop-blur-sm opacity-0 transition-none group-hover:opacity-100">
                            {reaction.label === 'Love'
                              ? 'Love it'
                              : reaction.label === 'Helpful'
                                ? 'Helpful tip'
                                : 'Inspired to practice'}
                          </span>
                          {reaction.icon}
                          <span className="text-xs">
                            {reaction.label === 'Love'
                              ? seededFallback?.love ?? reaction.count
                              : reaction.label === 'Helpful'
                                ? seededFallback?.helpful ?? reaction.count
                                : seededFallback?.inspired ?? reaction.count}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      {seededFallback?.reactions ?? 51} reactions
                    </span>
                    <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      {seededFallback?.comments ?? 9} comments
                    </span>
                    <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      {seededFallback?.views ?? 62} students viewed
                    </span>
                  </div>
                </div>
                  <div className="mt-5 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-e6f4ff)]/55 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        Student replies
                      </p>
                      {hasMoreComments && !isExpanded ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedComments(prev => ({
                              ...prev,
                              [entry.id]: true,
                            }))
                          }
                          className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-c8102e)]"
                        >
                          View more
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-3">
                      {visibleComments.map(comment => (
                        <div
                          key={`${comment.name}-${comment.message}`}
                          className="rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2"
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--c-9a9892)]">
                            {comment.name}
                          </p>
                          <p className="mt-1 text-sm text-[var(--c-1f1f1d)]">
                            {comment.message}
                          </p>
                        </div>
                      ))}
                      {comments.length === 0 ? (
                        <p className="text-sm text-[var(--c-6f6c65)]">
                          Be the first to add encouragement or a question.
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 rounded-full border border-[var(--c-e5e3dd)] bg-white px-4 py-2 text-xs text-[var(--c-9a9892)]">
                        Write a response or question...
                      </div>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </article>
              );
            })
          )}
        </div>

        <aside className="space-y-4">
          {previousPosts.length > 0 ? (
            <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5 shadow-sm lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Previous Posts
                </p>
                <span className="text-xs text-[var(--c-9a9892)]">
                  {entries.length > 8 ? `${entries.length - 8} total` : '0 total'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {previousPosts.map(entry => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-e6f4ff)]/50 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                        {entry.title}
                      </p>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-9a9892)]">
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                        }).format(new Date(entry.createdAt))}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--c-6f6c65)] line-clamp-3 whitespace-pre-line">
                      {entry.body}
                    </p>
                  </div>
                ))}
              </div>
              {hasMorePrevious ? (
                <button
                  type="button"
                  onClick={() => setShowAllPrevious(true)}
                  className="mt-4 w-full rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                >
                  More
                </button>
              ) : null}
            </section>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
