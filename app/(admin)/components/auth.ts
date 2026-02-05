export type UserRole = 'company' | 'teacher' | 'student';

export type AuthUser = {
  username: string;
  role: UserRole;
};

export const AUTH_STORAGE_KEY = 'sm_user';
export const VIEW_ROLE_STORAGE_KEY = 'sm_view_role';

export const roleHome: Record<UserRole, string> = {
  company: '/company',
  teacher: '/teachers',
  student: '/students',
};

export const navItems: Record<UserRole, Array<{ label: string; href: string }>> =
  {
    company: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Teachers', href: '/teachers' },
      { label: 'Students', href: '/students' },
      { label: 'Company', href: '/company' },
    ],
    teacher: [
      { label: 'Dashboard', href: '/teachers/dashboard' },
      { label: 'Students', href: '/teachers/students' },
      { label: 'This Week', href: '/teachers/this-week' },
      { label: 'Schedule', href: '/teachers/schedule' },
      { label: 'Lesson Fees', href: '/teachers/lesson-fees' },
    ],
    student: [
      { label: 'Dashboard', href: '/students/dashboard' },
      { label: 'Current Lesson', href: '/students/current-lesson' },
      { label: 'What To Practice', href: '/students/what-to-practice' },
      { label: 'Past Lessons', href: '/students/past-lessons' },
      { label: 'Practice Hub', href: '/students/practice-hub' },
      { label: 'Ask A Question', href: '/students/ask-question' },
      { label: 'My Account', href: '/students/my-account' },
    ],
  };

export const allowedRoots: Record<UserRole, string[]> = {
  company: ['/dashboard', '/company', '/teachers', '/students', '/curriculum'],
  teacher: ['/teachers', '/curriculum'],
  student: ['/students'],
};
