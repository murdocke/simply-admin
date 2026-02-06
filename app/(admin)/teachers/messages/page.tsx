"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import studentsData from "@/data/students.json";
import teachersData from "@/data/teachers.json";
import { AUTH_STORAGE_KEY, type AuthUser } from "../../components/auth";

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

const THREADS_STORAGE_KEY = "sm_message_threads";

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
  const teachers = useMemo(
    () => (teachersData.teachers as Teacher[]) ?? [],
    []
  );
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      setActiveTeacher(teachers[0] ?? null);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthUser;
      if (parsed?.role !== "teacher") {
        setActiveTeacher(teachers[0] ?? null);
        return;
      }
      const match =
        teachers.find(
          (teacher) => teacher.username === parsed.username
        ) ?? teachers[0] ?? null;
      setActiveTeacher(match);
    } catch {
      setActiveTeacher(teachers[0] ?? null);
    }
  }, [teachers]);

  const teacherId = activeTeacher?.id ?? "teacher";
  const students = useMemo(() => {
    const list = (studentsData.students as Student[])
      .filter((student) => student.status !== "Archived")
      .sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, []);

  const [recipientType, setRecipientType] = useState<RecipientType>("student");
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id ?? ""
  );
  const [draft, setDraft] = useState("");
  const [messagesByThread, setMessagesByThread] = useState<ThreadStore>({});

  const loadThreads = useCallback(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(THREADS_STORAGE_KEY);
    if (!stored) {
      setMessagesByThread({});
      return;
    }
    try {
      const parsed = JSON.parse(stored) as ThreadStore;
      setMessagesByThread(parsed ?? {});
    } catch {
      setMessagesByThread({});
    }
  }, []);

  const persistThreads = useCallback((next: ThreadStore) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("sm-message-thread-updated"));
  }, []);

  useEffect(() => {
    loadThreads();
    const handleUpdate = () => loadThreads();
    window.addEventListener("sm-message-thread-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("sm-message-thread-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadThreads]);

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
  const threadEntries = Object.entries(messagesByThread).filter(
    ([, threadMessages]) => threadMessages.length > 0
  );
  const visibleThreadEntries = threadEntries.filter(([threadId]) =>
    threadId.endsWith(`teacher:${teacherId}`)
  );

  const canSend =
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
    setMessagesByThread((prev) => {
      const next = {
        ...prev,
        [activeThreadId]: [...(prev[activeThreadId] ?? []), message],
      };
      persistThreads(next);
      return next;
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
          Conversation threads with students and studio staff.
        </p>
      </header>

      <section className="min-h-[calc(100vh-220px)] rounded-[28px] border border-[var(--c-ecebe7)] bg-[linear-gradient(160deg,var(--c-f7f7f5),var(--c-ffffff)_55%,var(--c-f8f6f1))] p-6 shadow-[0_20px_60px_-40px_rgba(15,15,15,0.35)]">
        <div className="flex flex-col gap-4 border-b border-[var(--c-ecebe7)] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
              Send a message
            </h2>
            <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
              Choose a student or corporate, then type and send. No subject line needed.
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
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Send To
                  </label>
                  <div className="mt-2 flex gap-2">
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

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Student Lookup
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    placeholder="Search by name, email, or level"
                    value={studentQuery}
                    onChange={(event) => setStudentQuery(event.target.value)}
                    disabled={recipientType === "corporate"}
                  />
                  <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        className={
                          selectedStudentId === student.id && recipientType === "student"
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
                          {student.lessonDay ?? "Lesson"} · {student.lessonTime ?? "Time TBD"}
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

                <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-3 text-sm text-[var(--c-6f6c65)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Selected Recipient
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
                        <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                          {isCorporateThread
                            ? "Corporate Inbox"
                            : threadStudent?.name ?? "Student"}
                        </p>
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
                  {recipientType === "corporate"
                    ? "Corporate Inbox"
                    : activeStudent?.name ?? "Select a student"}
                </h3>
                <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                  {recipientType === "corporate"
                    ? "Shared studio line"
                    : activeStudent
                      ? `${activeStudent.lessonDay ?? "Lesson"} · ${activeStudent.lessonTime ?? "Time TBD"}`
                      : "Student messages will appear here"}
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
                  const isTeacher = message.sender === "teacher";
                  const bubbleStyles = isTeacher
                    ? "max-w-[70%] rounded-2xl bg-[var(--c-1f1f1d)] text-[var(--c-ffffff)] px-4 py-3 text-right"
                    : "max-w-[70%] rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3";

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
                            ? "CO"
                            : activeStudent
                              ? getInitials(activeStudent.name)
                              : "ST"}
                        </div>
                      )}
                      <div className={bubbleStyles}>
                        <p
                          className={
                            isTeacher
                              ? "text-sm text-[var(--c-ffffff)]"
                              : "text-sm text-[var(--c-1f1f1d)]"
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
                          {isTeacher ? "You" : "Incoming"} ·{" "}
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
    </div>
  );
}
