'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  COMMUNICATIONS_UPDATE_EVENT,
  addCommunication,
  deleteCommunication,
  readCommunications,
  type CommunicationEntry,
} from '../../components/communications-store';
import { AUTH_STORAGE_KEY } from '../../components/auth';

type MediaType = 'none' | 'image' | 'video' | 'pdf';

const sampleReactions = [
  {
    label: 'Love',
    count: 20,
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
    count: 17,
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
    count: 14,
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

const replyDelays = [2000, 5000, 6000, 9000, 12000];
const replyNames = [
  'Ava Chen',
  'Miles Rivera',
  'Sofia Kim',
  'Elena Park',
  'Caleb Diaz',
];

const buildContextReplies = (title: string, body: string) => {
  const text = `${title} ${body}`.toLowerCase();
  const replies: string[] = [];

  if (text.includes('showcase') || text.includes('performance')) {
    replies.push('Can’t wait for the showcase — I’m practicing the ending now.');
  }
  if (text.includes('fee') || text.includes('payment') || text.includes('billing')) {
    replies.push('Thanks for the reminder — we’ll take care of the fee today.');
  }
  if (text.includes('schedule') || text.includes('reschedule')) {
    replies.push('Appreciate the schedule update — the new time works great.');
  }
  if (text.includes('practice') || text.includes('warmup') || text.includes('routine')) {
    replies.push('The practice plan feels super doable — thanks for laying it out.');
  }
  if (text.includes('video') || text.includes('clip')) {
    replies.push('The video tip helped a lot — the rhythm finally clicked.');
  }
  if (text.includes('lesson') || text.includes('assignment')) {
    replies.push('I’m ready for the next lesson — the checklist was helpful.');
  }
  if (text.includes('reminder')) {
    replies.push('Thanks for the reminder! I added it to my calendar.');
  }

  if (replies.length === 0) {
    replies.push(
      'Thanks for the update — this keeps me on track between lessons.',
      'Got it! I’m working on it tonight.',
      'This was super clear — appreciate the guidance.',
    );
  }

  return replies.slice(0, 5).map((message, index) => ({
    name: replyNames[index] ?? `Student ${index + 1}`,
    message,
  }));
};

export default function TeacherCommunicationsPage() {
  const [title, setTitle] = useState('February Monthly Lesson Fees');
  const [body, setBody] = useState(
    "Just a friendly reminder that February lesson fees are now past due... Please send your payment when you can.. Thanks! - Tiffany",
  );
  const [mediaType, setMediaType] = useState<MediaType>('none');
  const [mediaUrl, setMediaUrl] = useState('');
  const [entries, setEntries] = useState<CommunicationEntry[]>([]);
  const [author, setAuthor] = useState('Teacher');
  const [showAllPrevious, setShowAllPrevious] = useState(false);
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({});
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<CommunicationEntry | null>(
    null,
  );
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [simulatedReplies, setSimulatedReplies] = useState<
    Record<string, { name: string; message: string }[]>
  >({});
  const [simulatedReactions, setSimulatedReactions] = useState<
    Record<string, { love: number; helpful: number; inspired: number }>
  >({});
  const [simulatedCounts, setSimulatedCounts] = useState<
    Record<string, { reactions: number; comments: number; views: number }>
  >({});
  const [countBumps, setCountBumps] = useState<
    Record<string, { reactions?: boolean; comments?: boolean }>
  >({});
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { username?: string };
      if (parsed?.username) {
        setAuthor(parsed.username);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      const list = await readCommunications();
      if (isActive) {
        setEntries(list);
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

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    };
  }, []);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    const entry: CommunicationEntry = {
      id: crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      mediaType,
      mediaUrl: mediaType === 'none' ? '' : mediaUrl.trim(),
      createdAt: new Date().toISOString(),
      author,
    };
    setPendingEntry(entry);
    setIsPublishModalOpen(true);
  };

  const handlePublishNow = async () => {
    if (!pendingEntry) return;
    await addCommunication(pendingEntry);
    const updated = await readCommunications();
    setEntries(updated);
    scheduleFakeEngagement(pendingEntry.id);
    setTitle('');
    setBody('');
    setMediaUrl('');
    setMediaType('none');
    setPendingEntry(null);
    setIsPublishModalOpen(false);
    setScheduledDate('');
    setScheduledTime('09:00');
  };

  const handleSendLater = () => {
    if (!scheduledDate || !scheduledTime) return;
    setPendingEntry(null);
    setIsPublishModalOpen(false);
    setScheduledDate('');
    setScheduledTime('09:00');
  };

  const handleDelete = async (entryId: string) => {
    await deleteCommunication(entryId);
    const updated = await readCommunications();
    setEntries(updated);
    setSimulatedReplies(prev => {
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
    setSimulatedReactions(prev => {
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
    setSimulatedCounts(prev => {
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
    setCountBumps(prev => {
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
  };

  const bumpCount = (entryId: string, field: 'reactions' | 'comments') => {
    setCountBumps(prev => ({
      ...prev,
      [entryId]: { ...(prev[entryId] ?? {}), [field]: true },
    }));
    const timeoutId = window.setTimeout(() => {
      setCountBumps(prev => ({
        ...prev,
        [entryId]: { ...(prev[entryId] ?? {}), [field]: false },
      }));
    }, 320);
    timeoutsRef.current.push(timeoutId);
  };

  const scheduleFakeEngagement = (entryId: string) => {
    const contextualReplies = buildContextReplies(title, body);
    setSimulatedReplies(prev => ({ ...prev, [entryId]: [] }));
    setSimulatedReactions(prev => ({
      ...prev,
      [entryId]: { love: 0, helpful: 0, inspired: 0 },
    }));
    setSimulatedCounts(prev => ({
      ...prev,
      [entryId]: { reactions: 0, comments: 0, views: 0 },
    }));

    contextualReplies.forEach((reply, index) => {
      const timeoutId = window.setTimeout(() => {
        setSimulatedReplies(prev => ({
          ...prev,
          [entryId]: [
            ...(prev[entryId] ?? []),
            { name: reply.name, message: reply.message },
          ],
        }));
        setSimulatedCounts(prev => ({
          ...prev,
          [entryId]: {
            reactions: (prev[entryId]?.reactions ?? 0) + 6 + index * 2,
            comments: (prev[entryId]?.comments ?? 0) + 1,
            views: (prev[entryId]?.views ?? 0) + 14 + index * 6,
          },
        }));
        setSimulatedReactions(prev => ({
          ...prev,
          [entryId]: {
            love: (prev[entryId]?.love ?? 0) + 3 + (index % 2),
            helpful: (prev[entryId]?.helpful ?? 0) + 2 + (index % 3 === 0 ? 1 : 0),
            inspired: (prev[entryId]?.inspired ?? 0) + 2 + (index % 2 === 1 ? 1 : 0),
          },
        }));
        bumpCount(entryId, 'reactions');
        bumpCount(entryId, 'comments');
      }, replyDelays[index] ?? 12000);
      timeoutsRef.current.push(timeoutId);
    });
  };

  const preview = useMemo(() => entries[0], [entries]);
  const latestPosts = useMemo(() => entries.slice(0, 8), [entries]);
  const previousPosts = useMemo(() => {
    if (entries.length <= 8) return [];
    if (showAllPrevious) return entries.slice(8);
    return entries.slice(8, 16);
  }, [entries, showAllPrevious]);
  const hasMorePrevious = entries.length > 16;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Teachers
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Communications
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Studio announcements, reminders, and shared resources.
        </p>
      </header>

      <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <form
          className="w-full h-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            New Communication
          </p>
          <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Title
            <input
              type="text"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Studio update or highlight"
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
            />
          </label>
          <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Body
            <textarea
              value={body}
              onChange={event => setBody(event.target.value)}
              placeholder="Share the details for students..."
              className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
            />
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Header Media
              <select
                value={mediaType}
                onChange={event => setMediaType(event.target.value as MediaType)}
                className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              >
                <option value="none">None</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Upload Media
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={event => setMediaUrl(event.target.value)}
                  placeholder="Filename placeholder..."
                  className="w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  disabled={mediaType === 'none'}
                />
                <button
                  type="button"
                  disabled={mediaType === 'none'}
                  className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)] disabled:cursor-not-allowed disabled:border-[var(--c-ecebe7)] disabled:text-[var(--c-9a9892)]"
                >
                  Upload
                </button>
              </div>
            </label>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`mt-4 w-full rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              canSubmit
                ? 'border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] text-[var(--sidebar-accent-text)] hover:brightness-110'
                : 'border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
            }`}
          >
            Publish Communication
          </button>
        </form>

        <aside className="h-full">
          <section className="h-full overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm flex flex-col">
            {mediaType !== 'none' ? (
              <div className="w-full">
                {mediaType === 'image' ? (
                  <img
                    src={mediaUrl.trim() || '/reference/StudentVideo-2.png'}
                    alt={title || 'Post preview'}
                    className="h-56 w-full object-cover"
                  />
                ) : null}
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl.trim()}
                    controls
                    className="h-56 w-full object-cover"
                  />
                ) : null}
                {mediaType === 'pdf' ? (
                  <div className="p-4 text-sm text-[var(--c-6f6c65)]">
                    <span className="font-semibold text-[var(--c-c8102e)] underline underline-offset-4">
                      PDF attachment preview
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="p-6 flex-1 flex flex-col">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Preview
              </p>
              <p className="mt-3 text-xl font-semibold text-[var(--c-1f1f1d)]">
                {title.trim() || 'Untitled update'}
              </p>
              <p className="mt-3 text-lg text-[var(--c-6f6c65)] whitespace-pre-line">
                {body.trim() || 'Start typing to see your post preview here.'}
              </p>
              <div className="mt-auto space-y-5 pt-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {sampleReactions.map(reaction => (
                      <div
                        key={`preview-${reaction.label}`}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm ${reaction.bg} opacity-70`}
                      >
                        {reaction.icon}
                        <span className="text-xs">0</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      0 reactions
                    </span>
                    <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      0 comments
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-e7eddc)]/35 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      Student replies
                    </p>
                  </div>
                  <div className="mt-3 text-sm text-[var(--c-6f6c65)]">
                    Replies will appear here after you publish.
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
            </div>
          </section>
        </aside>
      </section>

      {isPublishModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsPublishModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Publish Communication
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Send now or schedule for later
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Date
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={event => setScheduledDate(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Time
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={event => setScheduledTime(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
            </div>
            <div className="mt-3 text-xs text-[var(--c-9a9892)]">
              Scheduled for {scheduledDate || '—'} at {scheduledTime || '—'}.
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleSendLater}
                disabled={!scheduledDate || !scheduledTime}
                className="w-full rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-9a9892)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send later
              </button>
              <button
                type="button"
                onClick={handlePublishNow}
                className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                Publish now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {latestPosts.length === 0 ? (
            <div className="w-full rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-sm text-[var(--c-6f6c65)]">
              No communications posted yet.
            </div>
          ) : (
            latestPosts.map((entry, index) => {
              const isShowcase =
                entry.title === 'Piano Showcase Highlight - Halloween Showcase';
              const comments =
                simulatedReplies[entry.id] ??
                buildContextReplies(entry.title, entry.body) ??
                sampleCommentsByIndex[index] ??
                [];
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
              const reactionCounts =
                simulatedReactions[entry.id] ??
                (seededFallback
                  ? {
                      love: seededFallback.love,
                      helpful: seededFallback.helpful,
                      inspired: seededFallback.inspired,
                    }
                  : { love: 20, helpful: 17, inspired: 14 });
              const totals =
                simulatedCounts[entry.id] ??
                (seededFallback
                  ? {
                      reactions: seededFallback.reactions,
                      comments: seededFallback.comments,
                      views: seededFallback.views,
                    }
                  : { reactions: 51, comments: 9, views: 62 });
              const bumps = countBumps[entry.id] ?? {};
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
                          className={`w-full object-cover ${index === 0 ? 'h-56' : 'h-36'}`}
                        />
                        {isShowcase ? (
                          <>
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.6))]" />
                            <div className="absolute bottom-3 left-4 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[15px] uppercase tracking-[0.25em] text-white/85">
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
                        className={`w-full object-cover ${index === 0 ? 'h-56' : 'h-36'}`}
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
                <div className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xl font-semibold text-[var(--c-1f1f1d)]">
                      {entry.title}
                    </p>
                    <span className="relative text-base uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }).format(new Date(entry.createdAt))}
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        aria-label="Delete post"
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </span>
                  </div>
                  <p className="mt-3 text-lg text-[var(--c-6f6c65)] whitespace-pre-line">
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
                            ? reactionCounts.love
                            : reaction.label === 'Helpful'
                              ? reactionCounts.helpful
                              : reactionCounts.inspired}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)] ${
                          bumps.reactions ? 'count-bump' : ''
                        }`}
                      >
                        {totals.reactions} reactions
                      </span>
                      <span
                        className={`rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)] ${
                          bumps.comments ? 'count-bump' : ''
                        }`}
                      >
                        {totals.comments} comments
                      </span>
                      <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        {totals.views} students viewed
                      </span>
                  </div>
                </div>
                  <div className="mt-5 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-e7eddc)]/35 p-4">
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
                          className="rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 fade-in-up"
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
                    className="rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-e7eddc)]/55 p-3"
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
