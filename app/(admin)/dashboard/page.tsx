import {
  OpenStudentRequestsTable,
  OpenTeacherRequestsTable,
  UnpaidRoyaltiesTable,
} from '../components/dashboard-tables';

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
            Overview
          </p>
          <h1 className="text-3xl font-semibold text-[#1f1f1d] mt-2">
            Dashboard
          </h1>
          <p className="text-sm text-[#6f6c65] mt-2">
            Choose a workspace to jump into a focused view.
          </p>
        </div>
        <div className="rounded-full border border-[#ecebe7] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#6f6c65] shadow-sm">
          Today
        </div>
      </div>

      <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
              Curriculum
            </p>
            <h2 className="text-2xl font-semibold text-[#1f1f1d] mt-2">
              Program Library
            </h2>
            <p className="text-sm text-[#6f6c65] mt-2">
              Jump into a specific pathway or program set.
            </p>
          </div>
          <span className="rounded-full border border-[#ecebe7] bg-[#fcfcfb] px-3 py-1 text-xs text-[#6f6c65]">
            Updated weekly
          </span>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <a
            href="/curriculum/foundation"
            className="rounded-2xl border border-[#ecebe7] bg-[#fcfcfb] p-5 text-left transition hover:border-[#c8102e]/30 hover:bg-white"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
              Foundation Program
            </p>
            <p className="mt-2 text-sm text-[#6f6c65]">
              Levels 1-9
            </p>
          </a>
          <a
            href="/curriculum/development"
            className="rounded-2xl border border-[#ecebe7] bg-[#fcfcfb] p-5 text-left transition hover:border-[#c8102e]/30 hover:bg-white"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
              Development Program
            </p>
            <p className="mt-2 text-sm text-[#6f6c65]">
              Levels 10-18
            </p>
          </a>
          <a
            href="/curriculum/special"
            className="rounded-2xl border border-[#ecebe7] bg-[#fcfcfb] p-5 text-left transition hover:border-[#c8102e]/30 hover:bg-white"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
              Special Programs
            </p>
            <p className="mt-2 text-sm text-[#6f6c65]">
              Masterclasses + Intensives
            </p>
          </a>
          <a
            href="/curriculum/supplemental"
            className="rounded-2xl border border-[#ecebe7] bg-[#fcfcfb] p-5 text-left transition hover:border-[#c8102e]/30 hover:bg-white"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
              Supplemental Programs
            </p>
            <p className="mt-2 text-sm text-[#6f6c65]">
              Teacher Created Programs
            </p>
          </a>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <a
          href="/teachers"
          className="group overflow-hidden rounded-2xl border border-[#ecebe7] bg-white shadow-sm transition hover:border-[#c8102e]/30 hover:shadow-md"
        >
          <div
            className="h-64 w-full bg-[#f1f1ef] bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://simplymusic.com/wp-content/uploads/2024/02/Teach_Simply_Music.png)',
            }}
          />
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
              Teachers
            </p>
            <h2 className="text-xl font-semibold mt-3 text-[#1f1f1d]">
              Training + Teaching
            </h2>
            <p className="text-sm text-[#6f6c65] mt-2">
              Curriculum, coaching, and studio resources for instructors.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-[#6f6c65]">
              <span className="rounded-full border border-[#ecebe7] px-3 py-1">
                Curriculum
              </span>
              <span className="rounded-full border border-[#ecebe7] px-3 py-1">
                Training &amp; Coaching
              </span>
              <span className="rounded-full border border-[#ecebe7] px-3 py-1">
                Library
              </span>
              <span className="rounded-full border border-[#ecebe7] px-3 py-1">
                Store
              </span>
            </div>
          </div>
        </a>

        <a
          href="/students"
          className="group overflow-hidden rounded-2xl border border-[#ecebe7] bg-white shadow-sm transition hover:border-[#c8102e]/30 hover:shadow-md"
        >
          <div
            className="h-64 w-full bg-[#f1f1ef] bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://simplymusic.com/wp-content/uploads/2024/02/Learn-Piano-with-a-Simply-Music-Teacher.png)',
              backgroundPosition: 'center 30%',
            }}
          />
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
              Students
            </p>
            <h2 className="text-xl font-semibold mt-3 text-[#1f1f1d]">
              Learning + Practicing
            </h2>
            <p className="text-sm text-[#6f6c65] mt-2">
              Guided progression and practice flow across levels.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-[#6f6c65]">
              <span className="rounded-full border border-[#ecebe7] px-3 py-1">
                Curriculum
              </span>
              <span className="rounded-full border border-[#ecebe7] px-3 py-1">
                Practice Mode
              </span>
            </div>
          </div>
        </a>

        <a
          href="/company"
          className="group overflow-hidden rounded-2xl border border-[#ecebe7] bg-white shadow-sm transition hover:border-[#c8102e]/30 hover:shadow-md"
        >
          <div
            className="h-64 w-full bg-[#f1f1ef] bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://simplymusic.com/wp-content/uploads/2024/02/Learn-with-Simply-Music-Self-Study-Program.png)',
              backgroundPosition: 'center 40%',
            }}
          />
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
              Company
            </p>
            <h2 className="text-xl font-semibold mt-3 text-[#1f1f1d]">
              Internal Operations
            </h2>
            <p className="text-sm text-[#6f6c65] mt-2">
              Teachers, students, commerce, royalties, and support tools.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-[#6f6c65]">
              <span className="rounded-full border border-[#ecebe7] px-3 py-1">
                Orders
              </span>
              <span className="rounded-full border border-[#ecebe7] px-3 py-1">
                Royalty Hub
              </span>
              <span className="rounded-full border border-[#ecebe7] px-3 py-1">
                Lesson Packs
              </span>
            </div>
          </div>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
            Active Students
          </p>
          <p className="text-4xl font-semibold mt-3 text-[#1f1f1d]">
            42
          </p>
          <p className="text-sm text-[#6f6c65] mt-2">Steady weekly growth</p>
        </div>
        <div className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
            Lessons Today
          </p>
          <p className="text-4xl font-semibold mt-3 text-[#1f1f1d]">
            8
          </p>
          <p className="text-sm text-[#6f6c65] mt-2">Evenly spaced sessions</p>
        </div>
        <div className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
            Payments Due
          </p>
          <p className="text-4xl font-semibold mt-3 text-[#1f1f1d]">
            $6,480
          </p>
          <p className="text-sm text-[#6f6c65] mt-2">Follow-ups scheduled</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OpenTeacherRequestsTable />
        <OpenStudentRequestsTable />
      </div>

      <div>
        <UnpaidRoyaltiesTable />
      </div>
    </div>
  );
}
