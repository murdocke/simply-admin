"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AUTH_STORAGE_KEY,
  VIEW_ROLE_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
  type AuthUser,
} from "../../components/auth";
import { useApiData } from "../../components/use-api-data";

type RecipientType = "student" | "corporate";

type Student = {
  id: string;
  name: string;
  email: string;
  level?: string;
  status?: string;
  lessonDay?: string;
  lessonTime?: string;
};

type Teacher = {
  id: string;
  name: string;
  email: string;
  username?: string;
};

type Message = {
  id: string;
  sender: "teacher" | "student" | "corporate";
  text: string;
  timestamp: string;
  subject?: string;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

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

const buildThreadId = (studentId: string, teacherId: string) =>
  `student:${studentId}|teacher:${teacherId}`;
const buildCorporateThreadId = (teacherId: string) =>
  `corporate|teacher:${teacherId}`;

const parseStudentIdFromThread = (threadId: string) => {
  if (!threadId.startsWith("student:")) return null;
  const [studentPart] = threadId.split("|");
  return studentPart?.replace("student:", "") ?? null;
};

export default function TeacherMessagesPage() {
  const searchParams = useSearchParams();
  const { data: teachersData } = useApiData<{ teachers: Teacher[] }>(
    "/api/teachers",
    { teachers: [] }
  );
  const { data: studentsData } = useApiData<{ students: Student[] }>(
    "/api/students",
    { students: [] }
  );
  const teachers = useMemo(
    () => (teachersData.teachers as Teacher[]) ?? [],
    [teachersData]
  );
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null);
  const [viewerRole, setViewerRole] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      setActiveTeacher(teachers[0] ?? null);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthUser;
      setViewerRole(parsed?.role ?? null);
      if (parsed?.role === "teacher") {
        const match =
          teachers.find(
            (teacher) => teacher.username === parsed.username
          ) ?? teachers[0] ?? null;
        setActiveTeacher(match);
        return;
      }
      if (parsed?.role === "company") {
        const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        if (storedView !== "teacher") {
          setActiveTeacher(teachers[0] ?? null);
          return;
        }
        const viewTeacherKey = parsed?.username
          ? `${VIEW_TEACHER_STORAGE_KEY}:${parsed.username}`
          : VIEW_TEACHER_STORAGE_KEY;
        const storedTeacher =
          window.localStorage.getItem(viewTeacherKey) ??
          window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
        if (storedTeacher) {
          try {
            const selected = JSON.parse(storedTeacher) as { username?: string };
            const match =
              teachers.find(
                (teacher) => teacher.username === selected?.username
              ) ?? teachers[0] ?? null;
            setActiveTeacher(match);
            return;
          } catch {
            setActiveTeacher(teachers[0] ?? null);
            return;
          }
        }
        setActiveTeacher(teachers[0] ?? null);
        return;
      }
      setActiveTeacher(teachers[0] ?? null);
    } catch {
      setActiveTeacher(teachers[0] ?? null);
      setViewerRole(null);
    }
  }, [teachers]);

  const teacherId = activeTeacher?.id ?? "teacher";
  const students = useMemo(() => {
    const list = (studentsData.students as Student[])
      .filter((student) => student.status !== "Archived")
      .sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [studentsData]);

  const [recipientType, setRecipientType] = useState<RecipientType>("student");
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id ?? ""
  );
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messagesByThread, setMessagesByThread] = useState<ThreadStore>({});
  const [threadSubjects, setThreadSubjects] = useState<Record<string, string>>(
    {}
  );
  const [threadReads, setThreadReads] = useState<Record<string, string>>({});
  const [studentOnline, setStudentOnline] = useState(false);
  const [teacherOnline, setTeacherOnline] = useState(false);
  const [studentTyping, setStudentTyping] = useState(false);
  const lastTypingPing = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      const response = await fetch("/api/messages");
      if (!response.ok) {
        setMessagesByThread({});
        setThreadSubjects({});
        return;
      }
      const data = (await response.json()) as {
        threads?: ThreadStore;
        subjects?: Record<string, string>;
      };
      setMessagesByThread(data.threads ?? {});
      setThreadSubjects(data.subjects ?? {});
    } catch {
      setMessagesByThread({});
      setThreadSubjects({});
    }
  }, []);

  const loadReads = useCallback(() => {
    if (typeof window === "undefined") return;
    const scopedKey = `${THREAD_READS_KEY_BASE}:teacher:${teacherId}`;
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
  }, [teacherId]);

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

  useEffect(() => {
    void loadThreads();
    const interval = window.setInterval(() => {
      void loadThreads();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [loadThreads]);

  useEffect(() => {
    loadReads();
    const handleUpdate = () => loadReads();
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadReads]);

  const filteredStudents = useMemo(() => {
    if (!studentQuery.trim()) return students;
    const query = studentQuery.trim().toLowerCase();
    return students.filter((student) =>
      [student.name, student.email, student.level].some((field) =>
        field?.toLowerCase().includes(query)
      )
    );
  }, [studentQuery, students]);

  const activeStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  const activeThreadId =
    recipientType === "corporate"
      ? buildCorporateThreadId(teacherId)
      : buildThreadId(selectedStudentId, teacherId);

  const messages = messagesByThread[activeThreadId] ?? [];
  const activeSubject = threadSubjects[activeThreadId];
  const threadEntries = Object.entries(messagesByThread).filter(
    ([, threadMessages]) => threadMessages.length > 0
  );
  const visibleThreadEntries = threadEntries.filter(([threadId]) =>
    threadId.endsWith(`teacher:${teacherId}`)
  );
  const getUnreadCount = (threadId: string, threadMessages: Message[]) => {
    const lastRead = threadReads[threadId];
    return threadMessages.filter((message) => {
      if (message.sender === "teacher") return false;
      if (!lastRead) return true;
      return new Date(message.timestamp) > new Date(lastRead);
    }).length;
  };

  useEffect(() => {
    const threadParam = searchParams.get("thread");
    if (!threadParam) return;
    if (threadParam.startsWith("corporate|")) {
      setRecipientType("corporate");
      return;
    }
    if (threadParam.startsWith("student:")) {
      const studentId = parseStudentIdFromThread(threadParam);
      if (studentId) {
        setRecipientType("student");
        setSelectedStudentId(studentId);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeThreadId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeThreadId) return;
    if (viewerRole !== "teacher") return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    setThreadReads((prev) => {
      const next = { ...prev, [activeThreadId]: lastMessage.timestamp };
      const scopedKey = `${THREAD_READS_KEY_BASE}:teacher:${teacherId}`;
      window.localStorage.setItem(scopedKey, JSON.stringify(next));
      return next;
    });
  }, [activeThreadId, messages, teacherId]);

  useEffect(() => {
    if (recipientType === "corporate") {
      setStudentTyping(false);
      return;
    }
    if (!activeThreadId) return;
    const key = `typing:${activeThreadId}:student`;
    const checkTyping = async () => {
      try {
        const response = await fetch(
          `/api/typing?key=${encodeURIComponent(key)}`
        );
        if (!response.ok) {
          setStudentTyping(false);
          return;
        }
        const data = (await response.json()) as { lastSeen?: string | null };
        if (!data.lastSeen) {
          setStudentTyping(false);
          return;
        }
        const diff = Date.now() - new Date(data.lastSeen).getTime();
        setStudentTyping(diff < 4000);
      } catch {
        setStudentTyping(false);
      }
    };
    void checkTyping();
    const interval = window.setInterval(() => {
      void checkTyping();
    }, 1500);
    return () => window.clearInterval(interval);
  }, [activeThreadId, recipientType]);

  useEffect(() => {
    if (recipientType === "corporate") return;
    if (!activeThreadId) return;
    if (!draft.trim()) return;
    const now = Date.now();
    if (now - lastTypingPing.current < 2000) return;
    lastTypingPing.current = now;
    void fetch("/api/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: `typing:${activeThreadId}:teacher` }),
    });
  }, [activeThreadId, draft, recipientType]);

  useEffect(() => {
    if (viewerRole !== "teacher") return;
    const key = `teacher:${teacherId}`;
    const markOnline = async () => {
      try {
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        setTeacherOnline(true);
      } catch {
        setTeacherOnline(false);
      }
    };
    void markOnline();
    const interval = window.setInterval(() => {
      void markOnline();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [teacherId, viewerRole]);

  useEffect(() => {
    if (!activeStudent) return;
    const key = `student:${activeStudent.id}`;
    const checkOnline = async () => {
      try {
        const response = await fetch(`/api/presence?key=${encodeURIComponent(key)}`);
        if (!response.ok) {
          setStudentOnline(false);
          return;
        }
        const data = (await response.json()) as { lastSeen?: string | null };
        if (!data.lastSeen) {
          setStudentOnline(false);
          return;
        }
        const diff = Date.now() - new Date(data.lastSeen).getTime();
        setStudentOnline(diff < 120000);
      } catch {
        setStudentOnline(false);
      }
    };
    void checkOnline();
    const interval = window.setInterval(() => {
      void checkOnline();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [activeStudent]);

  const isViewOnly = viewerRole === "company";
  const canSend =
    !isViewOnly &&
    draft.trim().length > 0 &&
    Boolean(activeTeacher) &&
    (recipientType === "corporate" || Boolean(activeStudent));

  const handleSend = () => {
    if (!canSend) return;
    const message: Message = {
      id: crypto.randomUUID(),
      sender: "teacher",
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
          Teachers
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Messages
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Keep track of student conversations and studio updates in one place.
        </p>
      </header>

      <section className="min-h-[calc(100vh-220px)] rounded-[28px] border border-[var(--c-ecebe7)] bg-[linear-gradient(160deg,var(--c-f7f7f5),var(--c-ffffff)_55%,var(--c-f8f6f1))] p-6 shadow-[0_20px_60px_-40px_rgba(15,15,15,0.35)]">
        <div className="flex flex-col gap-4 border-b border-[var(--c-ecebe7)] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
              Send a message
            </h2>
            <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
              Select a recipient and send a quick update or note.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/80 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                Recipient
              </p>
              <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-3 text-sm text-[var(--c-6f6c65)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Current
                </p>
                {recipientType === "corporate" ? (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      Corporate Inbox
                    </p>
                    <p className="text-xs text-[var(--c-6f6c65)]">
                      Shared by studio leadership.
                    </p>
                  </div>
                ) : activeStudent ? (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      {activeStudent.name}
                    </p>
                    <p className="text-xs text-[var(--c-6f6c65)]">
                      {activeStudent.email}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                    Choose a student to start messaging.
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsRecipientModalOpen(true)}
                className="mt-4 w-full rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-1f1f1d)] hover:text-[var(--c-1f1f1d)]"
              >
                Choose Recipient
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/85 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                  Threads
                </p>
                <span className="rounded-full bg-[var(--c-f8f6f1)] px-2 py-1 text-[11px] font-semibold text-[var(--c-6f6c65)]">
                  {visibleThreadEntries.length} Active
                </span>
              </div>
              <div className="mt-4 space-y-3">
                  {visibleThreadEntries.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fdfbf7)] px-3 py-4 text-center text-xs text-[var(--c-6f6c65)]">
                      Threads will appear once you or a student starts a conversation.
                    </div>
                  ) : (
                  visibleThreadEntries.map(([threadId, threadMessages]) => {
                    const isCorporateThread = threadId.startsWith("corporate|");
                    const threadStudentId = isCorporateThread
                      ? null
                      : parseStudentIdFromThread(threadId);
                    const threadStudent = students.find(
                      (student) => student.id === threadStudentId
                    );
                    const lastMessage =
                      threadMessages[threadMessages.length - 1];
                    const threadSubject = threadSubjects[threadId];
                    const unreadCount = getUnreadCount(
                      threadId,
                      threadMessages
                    );
                    const isActive =
                      (isCorporateThread && recipientType === "corporate") ||
                      (!isCorporateThread &&
                        recipientType === "student" &&
                        selectedStudentId === threadStudentId);

                    return (
                      <button
                        key={threadId}
                        className={
                          isActive
                            ? "w-full rounded-2xl border border-[var(--c-1f1f1d)] bg-[var(--c-f7f7f5)] px-3 py-3 text-left"
                            : "w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-3 text-left"
                        }
                        onClick={() => {
                          if (isCorporateThread) {
                            setRecipientType("corporate");
                          } else {
                            setRecipientType("student");
                            if (threadStudentId) {
                              setSelectedStudentId(threadStudentId);
                            }
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                            {isCorporateThread
                              ? "Corporate Inbox"
                              : threadStudent?.name ?? "Student"}
                          </p>
                          {unreadCount > 0 ? (
                            <span className="rounded-full bg-[var(--c-c8102e)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                              {unreadCount}
                            </span>
                          ) : null}
                        </div>
                        {threadSubject ? (
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                            {threadSubject}
                          </p>
                        ) : null}
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

          <div className="flex min-h-[calc(100vh-420px)] flex-col rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/90 backdrop-blur overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[var(--c-ecebe7)] bg-[var(--c-e6f4ff)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                  Conversation
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--c-1f1f1d)]">
                  {recipientType === "corporate"
                    ? "Corporate Inbox"
                    : activeStudent?.name ?? "Select a student"}
                </h3>
                {recipientType !== "corporate" && activeSubject ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    {activeSubject}
                  </p>
                ) : null}
                {recipientType === "corporate" ? (
                  <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                    Shared studio line
                  </p>
                ) : activeStudent ? null : (
                  <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                    Student messages will appear here
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                    recipientType === "corporate"
                      ? "border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)]"
                      : studentOnline
                        ? "border-[color:rgba(16,185,129,0.35)] bg-[color:rgba(16,185,129,0.18)] text-[color:rgb(16,185,129)]"
                        : "border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)]"
                  }`}
                >
                  {recipientType === "corporate"
                    ? "Online"
                    : studentOnline
                      ? "Online"
                      : "Offline"}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4 px-5 py-6 min-h-[320px] max-h-[560px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fdfbf7)] px-4 py-6 text-center text-sm text-[var(--c-6f6c65)]">
                  No messages yet. Send a note to start the conversation.
                </div>
              ) : (
                messages.map((message) => {
                  const isTeacher = message.sender === "teacher";
                  const senderLabel =
                    message.sender === "corporate"
                      ? "Simply Music"
                      : activeStudent?.name?.split(" ")[0] ?? "Student";
                  const bubbleStyles = isTeacher
                    ? "max-w-[85%] rounded-2xl bg-[var(--c-1f1f1d)] text-[var(--c-ffffff)] px-5 py-4 text-right"
                    : "max-w-[85%] rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-5 py-4";

                  return (
                    <div
                      key={message.id}
                      className={
                        isTeacher
                          ? "flex items-start justify-end gap-3"
                          : "flex items-start gap-3"
                      }
                    >
                      {!isTeacher && (
                        <div className="rounded-full bg-[var(--c-f8f6f1)] px-3 py-2 text-xs font-semibold text-[var(--c-6f6c65)]">
                          {message.sender === "corporate"
                            ? "Simply Music"
                            : activeStudent?.name?.split(" ")[0] ?? "Student"}
                        </div>
                      )}
                      <div className={bubbleStyles}>
                        {message.subject ? (
                          <p
                            className={
                              isTeacher
                                ? "text-[12px] font-semibold uppercase tracking-[0.25em] text-[var(--c-ffffff)] pb-1 border-b border-[color:rgba(255,255,255,0.35)]"
                                : "text-[12px] font-semibold uppercase tracking-[0.25em] text-[var(--c-6f6c65)] pb-1 border-b border-[var(--c-ecebe7)]"
                            }
                          >
                            {message.subject}
                          </p>
                        ) : null}
                        <p
                          className={
                            isTeacher
                              ? "text-sm text-[var(--c-ffffff)] mt-2"
                              : "text-sm text-[var(--c-1f1f1d)] mt-2"
                          }
                        >
                          {message.text}
                        </p>
                        <p
                          className={
                            isTeacher
                              ? "mt-2 text-[11px] uppercase tracking-[0.2em] text-[var(--c-ffffff)]/70"
                              : "mt-2 text-[11px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                          }
                        >
                          {isTeacher ? "You" : senderLabel} ·{" "}
                          {formatTime(new Date(message.timestamp))}
                        </p>
                      </div>
                      {isTeacher && (
                        <div className="rounded-full bg-[var(--c-1f1f1d)] px-3 py-2 text-xs font-semibold text-[var(--c-ffffff)]">
                          You
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {recipientType !== "corporate" && studentTyping ? (
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-9a9892)] [animation-delay:0ms] [animation-duration:1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-9a9892)] [animation-delay:150ms] [animation-duration:1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-9a9892)] [animation-delay:300ms] [animation-duration:1s]" />
                  </span>
                  {activeStudent?.name?.split(" ")[0] ?? "Student"} is typing
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[var(--c-ecebe7)] bg-[var(--c-e6f4ff)] px-5 py-4">
              <div className="rounded-2xl border border-[var(--c-d9e2ef)] bg-[var(--c-d9e2ef)] px-4 py-3">
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
                        : "rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] opacity-60"
                    }
                    onClick={handleSend}
                    disabled={!canSend}
                  >
                    {isViewOnly ? "View Only" : "Send"}
                  </button>
                </div>
                <textarea
                  className="mt-3 min-h-[110px] w-full resize-none rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder={
                    isViewOnly
                      ? "Viewing as company. Messaging is disabled."
                      : "Start typing here..."
                  }
                  value={draft}
                  onChange={(event) => {
                    if (isViewOnly) return;
                    setDraft(event.target.value);
                  }}
                  disabled={isViewOnly}
                  readOnly={isViewOnly}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`fixed inset-0 z-[60] ${
          isRecipientModalOpen ? "opacity-100" : "pointer-events-none opacity-0"
        } transition-opacity`}
      >
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
                Pick a student or the corporate inbox.
              </p>
            </div>
            <button
              onClick={() => setIsRecipientModalOpen(false)}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
            >
              Close
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Send To
            </p>
            <div className="mt-3 flex rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-1">
              <button
                className={
                  recipientType === "student"
                    ? "flex-1 rounded-full border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-ffffff)]"
                    : "flex-1 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                }
                onClick={() => setRecipientType("student")}
              >
                Student
              </button>
              <button
                className={
                  recipientType === "corporate"
                    ? "flex-1 rounded-full border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-ffffff)]"
                    : "flex-1 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                }
                onClick={() => setRecipientType("corporate")}
              >
                Corporate
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Student Lookup
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                placeholder="Search by name, email, or level"
                value={studentQuery}
                onChange={(event) => setStudentQuery(event.target.value)}
                disabled={recipientType === "corporate"}
              />
              <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    className={
                      selectedStudentId === student.id &&
                      recipientType === "student"
                        ? "w-full rounded-xl border border-[var(--c-1f1f1d)] bg-[var(--c-f7f7f5)] px-3 py-2 text-left"
                        : "w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-left"
                    }
                    onClick={() => {
                      setRecipientType("student");
                      setSelectedStudentId(student.id);
                    }}
                  >
                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      {student.name}
                    </p>
                    <p className="text-xs text-[var(--c-6f6c65)]">
                      {student.lessonDay ?? "Lesson"} ·{" "}
                      {student.lessonTime ?? "Time TBD"}
                    </p>
                  </button>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[var(--c-ecebe7)] px-3 py-3 text-xs text-[var(--c-6f6c65)]">
                    No students found. Try a different search.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4 text-sm text-[var(--c-6f6c65)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Selected
              </p>
              {recipientType === "corporate" ? (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                    Corporate Inbox
                  </p>
                  <p className="text-xs text-[var(--c-6f6c65)]">
                    Shared by studio leadership.
                  </p>
                </div>
              ) : activeStudent ? (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                    {activeStudent.name}
                  </p>
                  <p className="text-xs text-[var(--c-6f6c65)]">
                    {activeStudent.email}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                  Choose a student to start messaging.
                </p>
              )}
              <button
                onClick={() => setIsRecipientModalOpen(false)}
                className="mt-4 w-full rounded-full border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-ffffff)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
