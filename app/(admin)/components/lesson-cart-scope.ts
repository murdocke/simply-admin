'use client';

import { useEffect, useMemo, useState } from 'react';
import studentsData from '@/data/students.json';
import teachersData from '@/data/teachers.json';
import {
  VIEW_ROLE_STORAGE_KEY,
  VIEW_STUDENT_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
} from './auth';

const resolveStudentIdFromUser = (username?: string | null) => {
  if (!username) return null;
  const normalized = username.toLowerCase();
  const studentsList = studentsData.students as Array<{
    id: string;
    name: string;
    email: string;
  }>;
  return (
    studentsList.find(student => student.email.toLowerCase() === normalized)
      ?.id ??
    studentsList.find(student => student.name.toLowerCase() === normalized)
      ?.id ??
    studentsList.find(student =>
      student.name.toLowerCase().startsWith(normalized),
    )?.id ??
    null
  );
};

const resolveTeacherUsernameFromUser = (username?: string | null) => {
  if (!username) return null;
  const normalized = username.toLowerCase();
  const teachersList = teachersData.teachers as Array<{
    username?: string;
  }>;
  return (
    teachersList.find(teacher =>
      teacher.username?.toLowerCase().startsWith(normalized),
    )?.username ?? username
  );
};

export const makeStudentScope = (studentId: string) => `student:${studentId}`;
export const makeTeacherScope = (teacherUsername: string) =>
  `teacher:${teacherUsername}`;

export const useLessonCartScope = () => {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [teacherUsername, setTeacherUsername] = useState<string | null>(null);

  useEffect(() => {
    const loadScope = () => {
      try {
        const stored = window.localStorage.getItem('sm_user');
        if (!stored) return;
        const parsed = JSON.parse(stored) as { role?: string; username?: string };
        const baseRole = parsed?.role ?? null;
        const baseUsername = parsed?.username ?? null;
        setRole(baseRole);
        setUsername(baseUsername);

        if (baseRole === 'student') {
          setTeacherUsername(null);
          const resolved = resolveStudentIdFromUser(baseUsername);
          if (resolved) {
            setStudentId(resolved);
            return;
          }
          const storedStudent =
            window.localStorage.getItem(
              `${VIEW_STUDENT_STORAGE_KEY}:${baseUsername}`,
            ) ?? window.localStorage.getItem(VIEW_STUDENT_STORAGE_KEY);
          if (storedStudent) {
            const parsedStudent = JSON.parse(storedStudent) as { id?: string };
            if (parsedStudent?.id) {
              setStudentId(parsedStudent.id);
              return;
            }
          }
          setStudentId(null);
          return;
        }

        if (baseRole === 'teacher') {
          setStudentId(null);
          setTeacherUsername(resolveTeacherUsernameFromUser(baseUsername));
          return;
        }

        if (baseRole === 'company') {
          const viewRole = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
          if (viewRole === 'student') {
            setTeacherUsername(null);
            const storedStudent =
              window.localStorage.getItem(VIEW_STUDENT_STORAGE_KEY) ?? null;
            if (storedStudent) {
              const parsedStudent = JSON.parse(storedStudent) as { id?: string };
              if (parsedStudent?.id) {
                setStudentId(parsedStudent.id);
                return;
              }
            }
            setStudentId(resolveStudentIdFromUser(baseUsername));
            return;
          }
          if (viewRole === 'teacher') {
            setStudentId(null);
            const scopedTeacherKey = baseUsername
              ? `${VIEW_TEACHER_STORAGE_KEY}:${baseUsername}`
              : VIEW_TEACHER_STORAGE_KEY;
            const storedTeacher =
              window.localStorage.getItem(scopedTeacherKey) ??
              window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY) ??
              null;
            if (storedTeacher) {
              const parsedTeacher = JSON.parse(storedTeacher) as {
                username?: string;
              };
              if (parsedTeacher?.username) {
                setTeacherUsername(parsedTeacher.username);
                return;
              }
            }
            setTeacherUsername(resolveTeacherUsernameFromUser(baseUsername));
            return;
          }
        }
      } catch {
        setRole(null);
        setUsername(null);
        setStudentId(null);
        setTeacherUsername(null);
      }
    };

    loadScope();
    const handleStorage = () => loadScope();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('sm-view-teacher-updated', handleStorage);
    window.addEventListener('sm-view-student-updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sm-view-teacher-updated', handleStorage);
      window.removeEventListener('sm-view-student-updated', handleStorage);
    };
  }, []);

  const scope = useMemo(() => {
    if (role === 'student' && studentId) {
      return makeStudentScope(studentId);
    }
    if (role === 'teacher' && teacherUsername) {
      return makeTeacherScope(teacherUsername);
    }
    if (role === 'company') {
      if (studentId) return makeStudentScope(studentId);
      if (teacherUsername) return makeTeacherScope(teacherUsername);
    }
    return null;
  }, [role, studentId, teacherUsername]);

  return {
    scope,
    role,
    username,
    studentId,
    teacherUsername,
  };
};
