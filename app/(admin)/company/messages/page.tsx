"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApiData } from "../../components/use-api-data";

type Teacher = {
  id: string;
  name: string;
  email: string;
  region?: string;
  status?: string;
};

type Message = {
  id: string;
  sender: "corporate" | "teacher";
  text: string;
  timestamp: string;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const formatThreadTimestamp = (date: Date) =>
  date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const THREAD_READS_KEY_BASE = "sm_message_thread_reads";

type ThreadStore = Record<string, Message[]>;

const buildCorporateThreadId = (teacherId: string) =>
  `corporate|teacher:${teacherId}`;

const parseTeacherIdFromThread = (threadId: string) => {
  if (!threadId.startsWith("corporate|teacher:")) return null;
  return threadId.replace("corporate|teacher:", "");
};

export default function CompanyMessagesPage() {
  const { data: teachersData } = useApiData<{ teachers: Teacher[] }>(
    "/api/teachers",
    { teachers: [] }
  );
  const teachers = useMemo(
    () => (teachersData.teachers as Teacher[]) ?? [],
    [teachersData]
  );
  const [teacherQuery, setTeacherQuery] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    teachers[0]?.id ?? ""
  );
  const [draft, setDraft] = useState("");
  const [messagesByThread, setMessagesByThread] = useState<ThreadStore>({});
  const [threadReads, setThreadReads] = useState<Record<string, string>>({});
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);

  const filteredTeachers = useMemo(() => {
    if (!teacherQuery.trim()) return teachers;
    const query = teacherQuery.trim().toLowerCase();
    return teachers.filter((teacher) =>
      [teacher.name, teacher.email, teacher.region].some((field) =>
        field?.toLowerCase().includes(query)
      )
    );
  }, [teacherQuery, teachers]);

  const brianTeacher = useMemo(
    () =>
      teachers.find((teacher) =>
        teacher.name.toLowerCase().includes("brian")
      ) ?? null,
    [teachers]
  );

  useEffect(() => {
    if (!brianTeacher) return;
    setSelectedTeacherId(brianTeacher.id);
  }, [brianTeacher]);

  useEffect(() => {
    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0]?.id ?? "");
    }
  }, [selectedTeacherId, teachers]);

  const activeTeacher = teachers.find(
    (teacher) => teacher.id === selectedTeacherId
  );

  const loadThreads = useCallback(async () => {
    try {
      const response = await fetch("/api/messages");
      if (!response.ok) {
        setMessagesByThread({});
        return;
      }
      const data = (await response.json()) as { threads?: ThreadStore };
      setMessagesByThread(data.threads ?? {});
    } catch {
      setMessagesByThread({});
    }
  }, []);

  const persistMessage = useCallback(
    async (threadId: string, message: Message, subject?: string | null) => {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message, subject }),
      });
    },
    []
  );

  const loadReads = useCallback(() => {
    if (typeof window === "undefined") return;
    const scopedKey = `${THREAD_READS_KEY_BASE}:corporate`;
    const stored =
      window.localStorage.getItem(scopedKey) ??
      window.localStorage.getItem(THREAD_READS_KEY_BASE);
    if (!stored) {
      setThreadReads({});
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Record<string, string>;
      setThreadReads(parsed ?? {});
    } catch {
      setThreadReads({});
    }
  }, []);

  useEffect(() => {
    void loadThreads();
    const interval = window.setInterval(() => {
      void loadThreads();
    }, 5000);
    window.addEventListener("storage", loadReads);
    return () => {
      window.removeEventListener("storage", loadReads);
      window.clearInterval(interval);
    };
  }, [loadReads, loadThreads]);

  const activeThreadId = activeTeacher
    ? buildCorporateThreadId(activeTeacher.id)
    : "unassigned";

  const messages = messagesByThread[activeThreadId] ?? [];
  const threadEntries = Object.entries(messagesByThread).filter(
    ([threadId, threadMessages]) =>
      threadMessages.length > 0 && threadId.startsWith("corporate|teacher:")
  );
  const getUnreadCount = (threadId: string, threadMessages: Message[]) => {
    const lastRead = threadReads[threadId];
    return threadMessages.filter((message) => {
      if (message.sender === "corporate") return false;
      if (!lastRead) return true;
      return new Date(message.timestamp) > new Date(lastRead);
    }).length;
  };

  const canSend = draft.trim().length > 0 && Boolean(activeTeacher);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeThreadId) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    setThreadReads((prev) => {
      const next = { ...prev, [activeThreadId]: lastMessage.timestamp };
      const scopedKey = `${THREAD_READS_KEY_BASE}:corporate`;
      window.localStorage.setItem(scopedKey, JSON.stringify(next));
      return next;
    });
  }, [activeThreadId, messages]);

  const handleSend = () => {
    if (!canSend || !activeTeacher) return;
    const message: Message = {
      id: crypto.randomUUID(),
      sender: "corporate",
      text: draft.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessagesByThread((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] ?? []), message],
    }));
    void persistMessage(activeThreadId, message, null).then(() => {
      void loadThreads();
    });
    setDraft("");
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
          Company
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Messages
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Message teachers and respond to incoming staff threads.
        </p>
      </header>

      <section className="min-h-[calc(100vh-220px)] rounded-[28px] border border-[var(--c-ecebe7)] bg-[linear-gradient(160deg,var(--c-f7f7f5),var(--c-ffffff)_55%,var(--c-f8f6f1))] p-6 shadow-[0_20px_60px_-40px_rgba(15,15,15,0.35)]">
        <div className="flex flex-col gap-4 border-b border-[var(--c-ecebe7)] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
              Send a message
            </h2>
            <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
              Select a teacher and send a quick update or note.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Text Only
            </span>
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Replies Enabled
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/80 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                New Message
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-3 text-sm text-[var(--c-6f6c65)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Current
                  </p>
                  {activeTeacher ? (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                        {activeTeacher.name}
                      </p>
                      <p className="text-xs text-[var(--c-6f6c65)]">
                        {activeTeacher.email}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                      Choose a teacher to start messaging.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecipientModalOpen(true)}
                  className="w-full rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                >
                  Choose Recipient
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/85 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                  Threads
                </p>
                <span className="rounded-full bg-[var(--c-f8f6f1)] px-2 py-1 text-[11px] font-semibold text-[var(--c-6f6c65)]">
                  {threadEntries.length} Active
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {threadEntries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fdfbf7)] px-3 py-4 text-center text-xs text-[var(--c-6f6c65)]">
                    Threads will appear once you or a teacher starts a conversation.
                  </div>
                ) : (
                  threadEntries.map(([threadId, threadMessages]) => {
                    const threadTeacherId = parseTeacherIdFromThread(threadId);
                    const threadTeacher = teachers.find(
                      (teacher) => teacher.id === threadTeacherId
                    );
                    const lastMessage =
                      threadMessages[threadMessages.length - 1];
                    const unreadCount = getUnreadCount(
                      threadId,
                      threadMessages
                    );
                    const isActive = activeTeacher?.id === threadTeacherId;

                    return (
                      <button
                        key={threadId}
                        className={
                          isActive
                            ? "w-full rounded-2xl border border-[var(--c-1f1f1d)] bg-[var(--c-f7f7f5)] px-3 py-3 text-left"
                            : "w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-3 text-left"
                        }
                        onClick={() => {
                          if (threadTeacherId) {
                            setSelectedTeacherId(threadTeacherId);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                            {threadTeacher?.name ?? "Teacher"}
                          </p>
                          {unreadCount > 0 ? (
                            <span className="rounded-full bg-[var(--c-c8102e)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                              {unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                          {lastMessage?.text ?? "New conversation"}
                        </p>
                        {lastMessage?.timestamp ? (
                          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                            {formatThreadTimestamp(
                              new Date(lastMessage.timestamp)
                            )}
                          </p>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          <div className="flex min-h-[calc(100vh-420px)] flex-col rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/90 backdrop-blur">
            <div className="flex flex-col gap-4 border-b border-[var(--c-ecebe7)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                  Conversation
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--c-1f1f1d)]">
                  {activeTeacher?.name ?? "Teacher"}
                </h3>
                <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                  {activeTeacher
                    ? `${activeTeacher.region ?? "Region"} · ${activeTeacher.email}`
                    : "Select a teacher to start messaging"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-xs font-semibold text-[var(--c-6f6c65)]">
                  Live
                </span>
                <button className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  View Details
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 px-5 py-6">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fdfbf7)] px-4 py-6 text-center text-sm text-[var(--c-6f6c65)]">
                  No messages yet. Send a note to start the conversation.
                </div>
              ) : (
                messages.map((message) => {
                  const isCorporate = message.sender === "corporate";
                  const bubbleStyles = isCorporate
                    ? "max-w-[70%] rounded-2xl bg-[var(--c-1f1f1d)] text-[var(--c-ffffff)] px-4 py-3 text-right"
                    : "max-w-[70%] rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3";

                  return (
                    <div
                      key={message.id}
                      className={
                        isCorporate
                          ? "flex items-start justify-end gap-3"
                          : "flex items-start gap-3"
                      }
                    >
                      {!isCorporate && (
                        <div className="rounded-full bg-[var(--c-f8f6f1)] px-3 py-2 text-xs font-semibold text-[var(--c-6f6c65)]">
                          TR
                        </div>
                      )}
                      <div className={bubbleStyles}>
                        <p
                          className={
                            isCorporate
                              ? "text-sm text-[var(--c-ffffff)]"
                              : "text-sm text-[var(--c-1f1f1d)]"
                          }
                        >
                          {message.text}
                        </p>
                        <p
                          className={
                            isCorporate
                              ? "mt-2 text-[11px] uppercase tracking-[0.2em] text-[var(--c-ffffff)]/70"
                              : "mt-2 text-[11px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                          }
                        >
                          {isCorporate ? "You" : "Incoming"} ·{" "}
                          {formatTime(new Date(message.timestamp))}
                        </p>
                      </div>
                      {isCorporate && (
                        <div className="rounded-full bg-[var(--c-1f1f1d)] px-3 py-2 text-xs font-semibold text-[var(--c-ffffff)]">
                          You
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-[var(--c-ecebe7)] px-5 py-4">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fdfbf7)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                      Reply
                    </p>
                    <p className="text-sm text-[var(--c-6f6c65)]">
                      Type your message. Press send to deliver instantly.
                    </p>
                  </div>
                  <button
                    className={
                      canSend
                        ? "rounded-full border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-ffffff)]"
                        : "rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                    }
                    onClick={handleSend}
                    disabled={!canSend}
                  >
                    Send
                  </button>
                </div>
                <textarea
                  className="mt-3 min-h-[110px] w-full resize-none rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="Start typing here..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {isRecipientModalOpen ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsRecipientModalOpen(false)}
          />
          <div className="absolute inset-x-4 top-16 mx-auto max-w-2xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Send To
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Choose Recipient
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Pick a teacher to message.
                </p>
              </div>
              <button
                onClick={() => setIsRecipientModalOpen(false)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Teacher Lookup
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="Search by name, email, or region"
                  value={teacherQuery}
                  onChange={(event) => setTeacherQuery(event.target.value)}
                />
                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                  {filteredTeachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      className={
                        selectedTeacherId === teacher.id
                          ? "w-full rounded-xl border border-[var(--c-1f1f1d)] bg-[var(--c-f7f7f5)] px-3 py-2 text-left"
                          : "w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-left"
                      }
                      onClick={() => setSelectedTeacherId(teacher.id)}
                    >
                      <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                        {teacher.name}
                      </p>
                      <p className="text-xs text-[var(--c-6f6c65)]">
                        {teacher.region ?? "Region"} · {teacher.email}
                      </p>
                    </button>
                  ))}
                  {filteredTeachers.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--c-ecebe7)] px-3 py-3 text-xs text-[var(--c-6f6c65)]">
                      No teachers found. Try a different search.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4 text-sm text-[var(--c-6f6c65)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Selected
                </p>
                {activeTeacher ? (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      {activeTeacher.name}
                    </p>
                    <p className="text-xs text-[var(--c-6f6c65)]">
                      {activeTeacher.email}
                    </p>
                    <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                      {activeTeacher.region ?? "Region"} · Ready to message
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                    Choose a teacher to start messaging.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
