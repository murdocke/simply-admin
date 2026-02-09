export type UserRole = 'company' | 'teacher' | 'student';

export type AuthUser = {
  username: string;
  role: UserRole;
};

export const AUTH_STORAGE_KEY = 'sm_user';
export const VIEW_ROLE_STORAGE_KEY = 'sm_view_role';
export const VIEW_TEACHER_STORAGE_KEY = 'sm_view_teacher';
export const VIEW_STUDENT_STORAGE_KEY = 'sm_view_student';

export const roleHome: Record<UserRole, string> = {
  company: '/dashboard',
  teacher: '/teachers/dashboard',
  student: '/students/dashboard',
};

export const navItems: Record<UserRole, Array<{ label: string; href: string }>> =
  {
    company: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Curriculum', href: '/company/lesson-library' },
      { label: 'Subscriptions', href: '/subscriptions' },
      { label: 'Royalties', href: '/royalties' },
      { label: 'Accounts', href: '/accounts' },
      { label: 'Messages', href: '/company/messages' },
      { label: 'Support', href: '/support' },
    ],
    teacher: [
      { label: 'Dashboard', href: '/teachers/dashboard' },
      { label: 'This Week', href: '/teachers/this-week' },
      { label: 'Schedule', href: '/teachers/schedule' },
      { label: 'Students', href: '/teachers/students' },
      { label: 'Messages', href: '/teachers/messages' },
    ],
    student: [
      { label: 'Dashboard', href: '/students/dashboard' },
      { label: 'Current Lesson', href: '/students/current-lesson' },
      { label: 'Practice Hub', href: '/students/practice-hub' },
      { label: 'Lesson Library', href: '/students/lesson-library' },
      { label: 'Messages', href: '/students/messages' },
    ],
  };

export const allowedRoots: Record<UserRole, string[]> = {
  company: [
    '/dashboard',
    '/company',
    '/teachers',
    '/students',
    '/curriculum',
    '/subscriptions',
    '/royalties',
    '/accounts',
    '/account-permissions',
    '/support',
  ],
  teacher: ['/teachers', '/curriculum', '/checkout'],
  student: ['/students', '/checkout'],
};
