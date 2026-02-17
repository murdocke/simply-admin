"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AUTH_STORAGE_KEY,
  VIEW_ROLE_STORAGE_KEY,
  VIEW_STUDENT_STORAGE_KEY,
  type AuthUser,
} from "../../components/auth";
import { useApiData } from "../../components/use-api-data";

type Teacher = {
  id: string;
  name: string;
  email: string;
  region?: string;
  status?: string;
  username?: string;
  goesBy?: string;
};

type Student = {
  id: string;
  name: string;
  email: string;
  teacher?: string;
};

type Message = {
  id: string;
  sender: "student" | "teacher";
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

const parseTeacherIdFromThread = (threadId: string) => {
  if (!threadId.includes("|teacher:")) return null;
  const [, teacherPart] = threadId.split("|");
  return teacherPart?.replace("teacher:", "") ?? null;
};

export default function StudentMessagesPage() {
  const { data: teachersData } = useApiData<{ teachers: Teacher[] }>(
    "/api/teachers",
    { teachers: [] }
  );
  const { data: studentsData } = useApiData<{ students: Student[] }>(
    "/api/students",
    { students: [] }
  );
  const teachers = useMemo(() => {
    const list = (teachersData.teachers as Teacher[]).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return list;
  }, [teachersData]);

  const students = useMemo(
    () => (studentsData.students as Student[]) ?? [],
    [studentsData]
  );
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    teachers[0]?.id ?? ""
  );
  const [draft, setDraft] = useState("");
  const [messagesByThread, setMessagesByThread] = useState<ThreadStore>({});
  const [threadSubjects, setThreadSubjects] = useState<Record<string, string>>(
    {}
  );
  const [threadReads, setThreadReads] = useState<Record<string, string>>({});
  const [teacherOnline, setTeacherOnline] = useState(false);
  const [studentOnline, setStudentOnline] = useState(false);
  const [teacherTyping, setTeacherTyping] = useState(false);
  const lastTypingPing = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isViewOnly = viewerRole === "company";

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
    const studentId = activeStudent?.id ?? "unknown";
    const scopedKey = `${THREAD_READS_KEY_BASE}:student:${studentId}`;
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
  }, [activeStudent?.id]);

  const resolveStudent = useCallback(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      setActiveStudent(null);
      setViewerRole(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthUser;
      setViewerRole(parsed?.role ?? null);
      if (parsed?.role === "teacher" || parsed?.role === "company") {
        const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        const isStudentView = storedView === "student";
        if (!isStudentView) {
          setActiveStudent(null);
          return;
        }

        const viewStudentKey = parsed?.username
          ? `${VIEW_STUDENT_STORAGE_KEY}:${parsed.username}`
          : VIEW_STUDENT_STORAGE_KEY;
        const storedStudent =
          window.localStorage.getItem(viewStudentKey) ??
          window.localStorage.getItem(VIEW_STUDENT_STORAGE_KEY);

        if (storedStudent) {
          try {
            const selected = JSON.parse(storedStudent) as {
              id?: string;
              name?: string;
              email?: string;
            };
            if (selected?.id) {
              const matched =
                students.find((student) => student.id === selected.id) ?? null;
              setActiveStudent(matched);
              window.localStorage.setItem(viewStudentKey, storedStudent);
              return;
            }
            const byName = selected?.name
              ? students.find(
                  (student) =>
                    student.name.toLowerCase() === selected.name?.toLowerCase()
                )
              : null;
            const byEmail = selected?.email
              ? students.find(
                  (student) =>
                    student.email.toLowerCase() === selected.email?.toLowerCase()
                )
              : null;
            setActiveStudent(byName ?? byEmail ?? null);
            return;
          } catch {
            setActiveStudent(null);
            return;
          }
        }

        setActiveStudent(null);
        return;
      }

      if (parsed?.role === "student") {
        const normalized = parsed.username?.toLowerCase() ?? "";
        const match =
          students.find(
            (student) => student.email.toLowerCase() === normalized
          ) ??
          students.find(
            (student) => student.username?.toLowerCase() === normalized
          ) ??
          students.find(
            (student) => student.name.toLowerCase() === normalized
          ) ??
          students.find((student) =>
            student.name.toLowerCase().startsWith(normalized)
          ) ??
          null;
        setActiveStudent(match ?? students[0] ?? null);
        return;
      }

      setActiveStudent(null);
    } catch {
      setActiveStudent(null);
      setViewerRole(null);
    }
  }, [students]);

  useEffect(() => {
    resolveStudent();
    window.addEventListener("sm-view-student-updated", resolveStudent);
    window.addEventListener("sm-student-selection", resolveStudent);
    const interval = window.setInterval(() => {
      void loadThreads();
    }, 5000);
    window.addEventListener("sm-message-thread-updated", loadReads);
    window.addEventListener("storage", loadReads);
    return () => {
      window.removeEventListener("sm-view-student-updated", resolveStudent);
      window.removeEventListener("sm-student-selection", resolveStudent);
      window.removeEventListener("sm-message-thread-updated", loadReads);
      window.removeEventListener("storage", loadReads);
      window.clearInterval(interval);
    };
  }, [loadReads, loadThreads, resolveStudent]);

  useEffect(() => {
    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0]?.id ?? "");
    }
  }, [selectedTeacherId, teachers]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    loadReads();
  }, [loadReads]);

  const activeTeacher = useMemo(() => {
    if (!activeStudent) {
      return null;
    }
    if (!activeStudent?.teacher) {
      return teachers.find((teacher) => teacher.id === selectedTeacherId);
    }
    return (
      teachers.find((teacher) => teacher.username === activeStudent.teacher) ??
      teachers.find((teacher) => teacher.id === selectedTeacherId)
    );
  }, [activeStudent, selectedTeacherId, teachers]);
  const teacherDisplayName =
    activeTeacher?.goesBy ?? activeTeacher?.name ?? "Teacher";

  useEffect(() => {
    if (!activeStudent || viewerRole !== "student") return;
    const key = `student:${activeStudent.id}`;
    const markOnline = async () => {
      try {
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        setStudentOnline(true);
      } catch {
        setStudentOnline(false);
      }
    };
    void markOnline();
    const interval = window.setInterval(() => {
      void markOnline();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [activeStudent, viewerRole]);

  useEffect(() => {
    if (!activeTeacher) return;
    const key = `teacher:${activeTeacher.id}`;
    const checkOnline = async () => {
      try {
        const response = await fetch(`/api/presence?key=${encodeURIComponent(key)}`);
        if (!response.ok) {
          setTeacherOnline(false);
          return;
        }
        const data = (await response.json()) as { lastSeen?: string | null };
        if (!data.lastSeen) {
          setTeacherOnline(false);
          return;
        }
        const diff = Date.now() - new Date(data.lastSeen).getTime();
        setTeacherOnline(diff < 120000);
      } catch {
        setTeacherOnline(false);
      }
    };
    void checkOnline();
    const interval = window.setInterval(() => {
      void checkOnline();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [activeTeacher]);

  const activeThreadId =
    activeTeacher && activeStudent
      ? buildThreadId(activeStudent.id, activeTeacher.id)
      : "unassigned";
  const messages = messagesByThread[activeThreadId] ?? [];
  const activeSubject = threadSubjects[activeThreadId];
  const threadEntries = Object.entries(messagesByThread).filter(
    ([, threadMessages]) => threadMessages.length > 0
  );
  const visibleThreadEntries = threadEntries.filter(
    ([threadId]) => threadId === activeThreadId
  );
  const getUnreadCount = (threadId: string, threadMessages: Message[]) => {
    const lastRead = threadReads[threadId];
    return threadMessages.filter((message) => {
      if (message.sender === "student") return false;
      if (!lastRead) return true;
      return new Date(message.timestamp) > new Date(lastRead);
    }).length;
  };

  const canSend =
    !isViewOnly && draft.trim().length > 0 && Boolean(activeTeacher);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeThreadId) return;
    if (viewerRole !== "student") return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    setThreadReads((prev) => {
      const next = { ...prev, [activeThreadId]: lastMessage.timestamp };
      const studentId = activeStudent?.id ?? "unknown";
      const scopedKey = `${THREAD_READS_KEY_BASE}:student:${studentId}`;
      window.localStorage.setItem(scopedKey, JSON.stringify(next));
      return next;
    });
  }, [activeStudent?.id, activeThreadId, messages]);

  useEffect(() => {
    if (!activeThreadId) return;
    const key = `typing:${activeThreadId}:teacher`;
    const checkTyping = async () => {
      try {
        const response = await fetch(
          `/api/typing?key=${encodeURIComponent(key)}`
        );
        if (!response.ok) {
          setTeacherTyping(false);
          return;
        }
        const data = (await response.json()) as { lastSeen?: string | null };
        if (!data.lastSeen) {
          setTeacherTyping(false);
          return;
        }
        const diff = Date.now() - new Date(data.lastSeen).getTime();
        setTeacherTyping(diff < 4000);
      } catch {
        setTeacherTyping(false);
      }
    };
    void checkTyping();
    const interval = window.setInterval(() => {
      void checkTyping();
    }, 1500);
    return () => window.clearInterval(interval);
  }, [activeThreadId]);

  useEffect(() => {
    if (!activeThreadId) return;
    if (!draft.trim()) return;
    const now = Date.now();
    if (now - lastTypingPing.current < 2000) return;
    lastTypingPing.current = now;
    void fetch("/api/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: `typing:${activeThreadId}:student` }),
    });
  }, [activeThreadId, draft]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeThreadId]);

  const handleSend = () => {
    if (!canSend || isViewOnly) return;
    const message: Message = {
      id: crypto.randomUUID(),
      sender: "student",
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
          Students
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Messages
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Conversation threads with your teacher.
        </p>
      </header>

      <section className="rounded-[28px] border border-[var(--c-ecebe7)] bg-[linear-gradient(160deg,var(--c-f7f7f5),var(--c-ffffff)_55%,var(--c-f8f6f1))] p-6 shadow-[0_20px_60px_-40px_rgba(15,15,15,0.35)]">
        <div className="flex flex-col gap-4 border-b border-[var(--c-ecebe7)] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
              Send a message
            </h2>
            <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
              Send a quick update or question to your teacher.
            </p>
          </div>
          <div />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/80 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                New Message
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-3 text-sm text-[var(--c-6f6c65)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Teacher
                  </p>
                  {activeTeacher ? (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                        {teacherDisplayName}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                      Your teacher connection is being set up.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-3 text-sm text-[var(--c-6f6c65)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Student
                  </p>
                  {activeStudent ? (
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
                      Student profile unavailable.
                    </p>
                  )}
                </div>
              </div>
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
                      Threads will appear once you or your teacher starts a conversation.
                    </div>
                  ) : (
                  visibleThreadEntries.map(([threadId, threadMessages]) => {
                    const threadTeacherId = parseTeacherIdFromThread(threadId);
                    const threadTeacher = teachers.find(
                      (teacher) => teacher.id === threadTeacherId
                    );
                    const lastMessage =
                      threadMessages[threadMessages.length - 1];
                    const threadSubject = threadSubjects[threadId];
                    const unreadCount = getUnreadCount(
                      threadId,
                      threadMessages
                    );
                    const isActive = activeThreadId === threadId;

                    return (
                      <div
                        key={threadId}
                        className={
                          isActive
                            ? "w-full rounded-2xl border border-[var(--c-1f1f1d)] bg-[var(--c-f7f7f5)] px-3 py-3 text-left"
                            : "w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-3 text-left"
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                            {activeTeacher?.goesBy ??
                              activeTeacher?.name ??
                              threadTeacher?.goesBy ??
                              threadTeacher?.name ??
                              "Teacher"}
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
                      </div>
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
                  {teacherDisplayName}
                </h3>
                {activeSubject ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    {activeSubject}
                  </p>
                ) : null}
                {activeTeacher ? null : (
                  <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                    Your teacher will appear here
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                    teacherOnline
                      ? "border-[color:rgba(16,185,129,0.35)] bg-[color:rgba(16,185,129,0.18)] text-[color:rgb(16,185,129)]"
                      : "border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)]"
                  }`}
                >
                  {teacherOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4 px-5 py-6 min-h-0 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fdfbf7)] px-4 py-6 text-center text-sm text-[var(--c-6f6c65)]">
                  No messages yet. Send a note to start the conversation.
                </div>
              ) : (
                messages.map((message) => {
                  const isStudent = message.sender === "student";
                  const bubbleStyles = isStudent
                    ? "max-w-[85%] rounded-2xl px-5 py-4 text-right"
                    : "max-w-[85%] rounded-2xl border bg-[color:var(--teacher-bubble-bg)] px-5 py-4";

                  return (
                    <div
                      key={message.id}
                      className={
                        isStudent
                          ? "flex items-start justify-end gap-3"
                          : "flex items-start gap-3"
                      }
                    >
                      {!isStudent && (
                        <div
                          className="rounded-full px-3 py-2 text-xs font-semibold"
                          style={{
                            backgroundColor: "var(--teacher-chip-bg)",
                            color: "var(--teacher-chip-text)",
                          }}
                        >
                          {teacherDisplayName}
                        </div>
                      )}
                      <div
                        className={bubbleStyles}
                        style={{
                          borderColor: isStudent
                            ? "transparent"
                            : "var(--teacher-bubble-border)",
                          backgroundColor: isStudent
                            ? "var(--student-bubble-bg)"
                            : "var(--teacher-bubble-bg)",
                          color: isStudent
                            ? "var(--student-bubble-text)"
                            : "var(--teacher-bubble-text)",
                        }}
                      >
                        {message.subject ? (
                          <p
                            className={
                              isStudent
                                ? "text-[12px] font-semibold uppercase tracking-[0.25em] pb-1 border-b"
                                : "text-[12px] font-semibold uppercase tracking-[0.25em] pb-1 border-b"
                            }
                            style={
                              isStudent
                                ? {
                                    color: "var(--student-bubble-subject)",
                                    borderColor: "var(--student-bubble-divider)",
                                  }
                                : {
                                    color: "var(--teacher-bubble-meta)",
                                    borderColor: "var(--teacher-bubble-border)",
                                  }
                            }
                          >
                            {message.subject}
                          </p>
                        ) : null}
                        <p
                          className={
                            isStudent
                              ? "text-sm mt-2"
                              : "text-sm mt-2"
                          }
                          style={
                            isStudent
                              ? { color: "var(--student-bubble-text)" }
                              : { color: "var(--teacher-bubble-text)" }
                          }
                        >
                          {message.text}
                        </p>
                        <p
                          className={
                            isStudent
                              ? "mt-2 text-[11px] uppercase tracking-[0.2em]"
                              : "mt-2 text-[11px] uppercase tracking-[0.2em]"
                          }
                          style={
                            isStudent
                              ? { color: "var(--student-bubble-meta)" }
                              : { color: "var(--teacher-bubble-meta)" }
                          }
                        >
                          {isStudent ? "You" : teacherDisplayName} ·{" "}
                          {formatTime(new Date(message.timestamp))}
                        </p>
                      </div>
                      {isStudent && (
                        <div
                          className="rounded-full px-3 py-2 text-xs font-semibold"
                          style={{
                            backgroundColor: "var(--student-chip-bg)",
                            color: "var(--student-chip-text)",
                          }}
                        >
                          You
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {teacherTyping ? (
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-9a9892)] [animation-delay:0ms] [animation-duration:1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-9a9892)] [animation-delay:150ms] [animation-duration:1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-9a9892)] [animation-delay:300ms] [animation-duration:1s]" />
                  </span>
                  {teacherDisplayName} is typing
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
                      Type your message and press send.
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
    </div>
  );
}
