import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

type OrderKind =
  | 'curriculum-teacher'
  | 'curriculum-student'
  | 'subscription-teacher'
  | 'subscription-student';

type OrderRow = {
  id: string;
  kind: OrderKind;
  buyer: string;
  items: string;
  total: number;
  status: 'Paid' | 'Pending' | 'Refunded';
  date: string;
  createdAt: string;
};

const teacherItems = [
  'Foundation Level 1',
  'Foundation Level 2',
  'Development Level 1',
  'Development Level 2',
  'Curriculum Guide Bundle',
  'Supplemental: Chord Sheets',
  'Supplemental: Rhythm Studies',
  'Lesson Pack: Teaching Toolkit',
];

const studentItems = [
  'Lesson Pack: Rhythm Lab',
  'Lesson Pack: Sight Reading',
  'Curriculum Guide: Prep',
  'Supplemental: Ear Training',
  'Lesson Pack: Practice Sprint',
  'Lesson Pack: Melody Builder',
  'Supplemental: Theory Basics',
  'Lesson Pack: Performance Set',
];

const teacherBuyers = [
  'S. Hayes',
  'M. Lin',
  'E. Grant',
  'J. Ortiz',
  'T. Moss',
  'R. Patel',
  'K. Boyd',
  'D. Nguyen',
];

const studentBuyers = [
  'A. Keller',
  'N. Brooks',
  'L. Park',
  'R. Cruz',
  'S. Reed',
  'C. Walsh',
  'M. Tran',
  'I. Young',
];

const subscriptionTeachers = [
  'A. Johnson',
  'S. Rivera',
  'M. Chen',
  'L. Patel',
  'D. Brooks',
  'K. Walker',
  'N. Bennett',
  'T. Nguyen',
];

const subscriptionStudents = [
  'E. Morales',
  'C. Ortiz',
  'J. Harper',
  'P. Diaz',
  'R. Cole',
  'I. Shah',
  'B. Fisher',
  'S. Park',
];

const statusPool: Array<OrderRow['status']> = ['Paid', 'Paid', 'Paid', 'Pending', 'Refunded'];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

function seedOrders(db: ReturnType<typeof getDb>) {
  const count = db.prepare('SELECT COUNT(*) as count FROM orders').get() as {
    count: number;
  };
  if (count.count > 0) return;

  const now = new Date('2026-02-12T10:00:00Z');
  const insert = db.prepare(
    `INSERT INTO orders (id, kind, buyer, items, total, status, date, created_at)
     VALUES (@id, @kind, @buyer, @items, @total, @status, @date, @createdAt)`
  );

  const tx = db.transaction((rows: OrderRow[]) => {
    for (const row of rows) {
      insert.run({
        id: row.id,
        kind: row.kind,
        buyer: row.buyer,
        items: row.items,
        total: row.total,
        status: row.status,
        date: row.date,
        createdAt: row.createdAt,
      });
    }
  });

  const curriculumTeacher = Array.from({ length: 40 }, (_, index) => {
    const total = 180 + ((index * 9) % 5) * 15 + (index % 3) * 10;
    const day = 10 - (index % 10);
    const month = index < 20 ? '2026-02' : '2026-01';
    return {
      id: `T-${10492 - index}`,
      kind: 'curriculum-teacher' as const,
      buyer: teacherBuyers[index % teacherBuyers.length],
      items: teacherItems[index % teacherItems.length],
      total,
      status: statusPool[index % statusPool.length],
      date: `${month}-${String(day).padStart(2, '0')}`,
      createdAt: now.toISOString(),
    };
  });

  const curriculumStudent = Array.from({ length: 40 }, (_, index) => {
    const total = 35 + ((index * 9) % 5) * 15 + (index % 3) * 10;
    const day = 10 - (index % 10);
    const month = index < 20 ? '2026-02' : '2026-01';
    return {
      id: `S-${23891 - index}`,
      kind: 'curriculum-student' as const,
      buyer: studentBuyers[index % studentBuyers.length],
      items: studentItems[index % studentItems.length],
      total,
      status: statusPool[index % statusPool.length],
      date: `${month}-${String(day).padStart(2, '0')}`,
      createdAt: now.toISOString(),
    };
  });

  const subscriptionTeacher = Array.from({ length: 750 }, (_, index) => {
    const studentCount = 18 + (index % 12);
    return {
      id: `TS-${10500 - index}`,
      kind: 'subscription-teacher' as const,
      buyer: subscriptionTeachers[index % subscriptionTeachers.length],
      items: `Teacher subscription · ${studentCount} students`,
      total: studentCount * 9,
      status: index % 7 === 0 ? 'Pending' : 'Paid',
      date: '2026-02-01',
      createdAt: now.toISOString(),
    };
  });

  const totalStudents = subscriptionTeacher.reduce((sum, row) => {
    const match = row.items.match(/(\d+) students/);
    return sum + (match ? Number(match[1]) : 0);
  }, 0);

  const subscriptionStudent = Array.from({ length: totalStudents }, (_, index) => {
    const day = (index % 28) + 1;
    return {
      id: `SS-${58000 - index}`,
      kind: 'subscription-student' as const,
      buyer: `${subscriptionStudents[index % subscriptionStudents.length]} #${index + 1}`,
      items: 'Student access subscription',
      total: 4,
      status: index % 11 === 0 ? 'Pending' : 'Paid',
      date: `2026-02-${String(day).padStart(2, '0')}`,
      createdAt: now.toISOString(),
    };
  });

  tx([
    ...curriculumTeacher,
    ...curriculumStudent,
    ...subscriptionTeacher,
    ...subscriptionStudent,
  ]);
}

function mapSortKey(key: string | null) {
  switch (key) {
    case 'id':
      return 'id';
    case 'buyer':
      return 'buyer';
    case 'items':
      return 'items';
    case 'total':
      return 'total';
    case 'status':
      return 'status';
    case 'date':
      return 'date';
    default:
      return 'date';
  }
}

function mapSortDir(dir: string | null) {
  return dir === 'ASC' ? 'ASC' : 'DESC';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const summary = searchParams.get('summary');
  const db = getDb();
  seedOrders(db);

  if (summary === '1') {
    const totals = db
      .prepare(
        `SELECT
          SUM(CASE WHEN kind = 'subscription-teacher' THEN total ELSE 0 END) as subTeacherTotal,
          SUM(CASE WHEN kind = 'subscription-student' THEN total ELSE 0 END) as subStudentTotal,
          SUM(CASE WHEN kind IN ('subscription-teacher', 'subscription-student') AND status = 'Pending' THEN total ELSE 0 END) as subPendingTotal,
          SUM(CASE WHEN kind IN ('subscription-teacher', 'subscription-student') AND status = 'Pending' THEN 1 ELSE 0 END) as subPendingCount,
          SUM(CASE WHEN kind = 'subscription-teacher' THEN 1 ELSE 0 END) as subTeacherCount,
          SUM(CASE WHEN kind = 'subscription-student' THEN 1 ELSE 0 END) as subStudentCount,
          SUM(CASE WHEN kind IN ('curriculum-teacher', 'curriculum-student') THEN total ELSE 0 END) as curriculumTotal,
          SUM(CASE WHEN kind IN ('curriculum-teacher', 'curriculum-student') THEN 1 ELSE 0 END) as curriculumCount,
          SUM(CASE WHEN kind IN ('curriculum-teacher', 'curriculum-student') AND status = 'Refunded' THEN 1 ELSE 0 END) as curriculumRefunds,
          SUM(CASE WHEN kind = 'curriculum-teacher' THEN total ELSE 0 END) as curriculumTeacherTotal,
          SUM(CASE WHEN kind = 'curriculum-teacher' THEN 1 ELSE 0 END) as curriculumTeacherCount,
          SUM(CASE WHEN kind = 'curriculum-student' THEN total ELSE 0 END) as curriculumStudentTotal,
          SUM(CASE WHEN kind = 'curriculum-student' THEN 1 ELSE 0 END) as curriculumStudentCount
        FROM orders`
      )
      .get() as Record<string, number>;

    const avgOrderValue = totals.curriculumCount
      ? totals.curriculumTotal / totals.curriculumCount
      : 0;
    const refundRate = totals.curriculumCount
      ? totals.curriculumRefunds / totals.curriculumCount
      : 0;

    return NextResponse.json({
      subscriptions: {
        teacherTotal: totals.subTeacherTotal ?? 0,
        teacherCount: totals.subTeacherCount ?? 0,
        studentTotal: totals.subStudentTotal ?? 0,
        studentCount: totals.subStudentCount ?? 0,
        pendingCount: totals.subPendingCount ?? 0,
        pendingTotal: totals.subPendingTotal ?? 0,
      },
      curriculum: {
        total: totals.curriculumTotal ?? 0,
        count: totals.curriculumCount ?? 0,
        avgOrderValue,
        refundRate,
        teacherTotal: totals.curriculumTeacherTotal ?? 0,
        teacherCount: totals.curriculumTeacherCount ?? 0,
        studentTotal: totals.curriculumStudentTotal ?? 0,
        studentCount: totals.curriculumStudentCount ?? 0,
      },
    });
  }

  const kind = searchParams.get('kind') as OrderKind | null;
  if (!kind) {
    return NextResponse.json({ error: 'Missing kind' }, { status: 400 });
  }
  const allowed: OrderKind[] = [
    'curriculum-teacher',
    'curriculum-student',
    'subscription-teacher',
    'subscription-student',
  ];
  if (!allowed.includes(kind)) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
  }

  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 25)));
  const query = (searchParams.get('query') ?? '').trim().toLowerCase();
  const sortKey = mapSortKey(searchParams.get('sortKey'));
  const sortDir = mapSortDir(searchParams.get('sortDir'));

  const whereParts = ['kind = @kind'];
  const params: Record<string, string | number> = { kind };
  if (query) {
    whereParts.push(
      `(
        LOWER(id) LIKE @q OR
        LOWER(buyer) LIKE @q OR
        LOWER(items) LIKE @q OR
        LOWER(status) LIKE @q OR
        LOWER(date) LIKE @q
      )`,
    );
    params.q = `%${query}%`;
  }
  const whereClause = whereParts.join(' AND ');
  const total = db
    .prepare(`SELECT COUNT(*) as count FROM orders WHERE ${whereClause}`)
    .get(params) as { count: number };

  const rows = db
    .prepare(
      `SELECT id, buyer, items, total, status, date FROM orders
       WHERE ${whereClause}
       ORDER BY ${sortKey} ${sortDir}
       LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit: pageSize, offset: (page - 1) * pageSize }) as Array<
    Record<string, string | number>
  >;

  const payload = rows.map(row => ({
    id: String(row.id ?? ''),
    buyer: String(row.buyer ?? ''),
    items: String(row.items ?? ''),
    total: Number(row.total ?? 0),
    status: String(row.status ?? 'Paid'),
    date: formatDate(String(row.date ?? '')),
  }));

  return NextResponse.json({
    rows: payload,
    total: total.count ?? 0,
    page,
    pageSize,
  });
}
