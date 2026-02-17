export type UserRole = 'company' | 'teacher' | 'student' | 'parent';

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
  parent: '/parents/dashboard',
};

export const navItems: Record<UserRole, Array<{ label: string; href: string }>> =
  {
    company: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Curriculum', href: '/company/lesson-library' },
      { label: 'Orders', href: '/company/orders' },
      { label: 'Subscriptions', href: '/subscriptions' },
      { label: 'Royalties', href: '/royalties' },
      { label: 'Accounts', href: '/accounts' },
      { label: 'Studios', href: '/studios/dashboard' },
      { label: 'Notifications', href: '/notifications' },
      { label: 'Messages', href: '/company/messages' },
      { label: 'Support', href: '/support' },
    ],
    teacher: [
      { label: 'Dashboard', href: '/teachers/dashboard' },
      { label: 'Studio', href: '/studios/dashboard' },
      { label: 'This Week', href: '/teachers/this-week' },
      { label: 'Schedule', href: '/teachers/schedule' },
      { label: 'Students', href: '/teachers/students' },
      { label: 'Communications', href: '/teachers/communications' },
      { label: 'Messages', href: '/teachers/messages' },
    ],
    student: [
      { label: 'Dashboard', href: '/students/dashboard' },
      { label: 'Current Lesson', href: '/students/current-lesson' },
      { label: 'Practice Hub', href: '/students/practice-hub' },
      { label: 'Lesson Library', href: '/students/lesson-library' },
      { label: 'Communications', href: '/students/communications' },
      { label: 'Messages', href: '/students/messages' },
    ],
    parent: [
      { label: 'Dashboard', href: '/parents/dashboard' },
      { label: 'Students', href: '/parents/students' },
      { label: 'Schedule', href: '/parents/schedule' },
      { label: 'Communications', href: '/parents/communications' },
      { label: 'Messages', href: '/parents/messages' },
      { label: 'Billing', href: '/parents/billing' },
    ],
  };

export const allowedRoots: Record<UserRole, string[]> = {
  company: [
    '/dashboard',
    '/company',
    '/company/orders',
    '/lesson-pack-builder',
    '/teachers',
    '/students',
    '/curriculum',
    '/subscriptions',
    '/royalties',
    '/accounts',
    '/notifications',
    '/account-permissions',
    '/studios',
    '/support',
    '/teacher-interest',
  ],
  teacher: [
    '/teachers',
    '/students/lesson-packs',
    '/teachers/lesson-packs',
    '/curriculum',
    '/checkout',
    '/lesson-room',
    '/studios',
  ],
  student: ['/students', '/checkout', '/lesson-room'],
  parent: ['/parents', '/checkout'],
};
