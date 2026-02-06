const tableBase =
  'w-full text-left text-sm text-[var(--c-3a3935)] border-separate border-spacing-0';

const headerCell =
  'px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] border-b border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]';

const bodyCell = 'px-4 py-3 border-b border-[var(--c-f1f0ec)]';

export function OpenTeacherRequestsTable() {
  const rows = [
    { name: 'Alicia M.', studio: 'North Hills', status: 'Pending Review' },
    { name: 'Brett K.', studio: 'Downtown', status: 'Needs Docs' },
    { name: 'Carla J.', studio: 'Riverwood', status: 'Interview Set' },
    { name: 'Dorian S.', studio: 'Westgate', status: 'Awaiting Response' },
  ];

  return (
    <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm">
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Open Teacher Requests
          </p>
          <h3 className="text-lg font-semibold text-[var(--c-1f1f1d)] mt-2">
            New Instructor Pipeline
          </h3>
        </div>
        <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
          12 Open
        </span>
      </div>
      <div className="px-6 pb-6 pt-4">
        <div className="overflow-hidden rounded-xl border border-[var(--c-ecebe7)]">
          <table className={tableBase}>
            <thead>
              <tr>
                <th className={headerCell}>Teacher</th>
                <th className={headerCell}>Studio</th>
                <th className={headerCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.name} className="bg-[var(--c-ffffff)]">
                  <td className={bodyCell}>{row.name}</td>
                  <td className={bodyCell}>{row.studio}</td>
                  <td className={bodyCell}>
                    <span className="rounded-full bg-[var(--c-f1f1ef)] px-3 py-1 text-xs text-[var(--c-5b5952)]">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function OpenStudentRequestsTable() {
  const rows = [
    { name: 'Leo P.', level: 'Foundation 2', status: 'Awaiting Match' },
    { name: 'Mina T.', level: 'Foundation 4', status: 'Needs Follow-up' },
    { name: 'Omar V.', level: 'Special Program', status: 'Assigned' },
    { name: 'Priya R.', level: 'Foundation 1', status: 'Scheduling' },
  ];

  return (
    <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm">
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Open Student Requests
          </p>
          <h3 className="text-lg font-semibold text-[var(--c-1f1f1d)] mt-2">
            New Student Intake
          </h3>
        </div>
        <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
          18 Open
        </span>
      </div>
      <div className="px-6 pb-6 pt-4">
        <div className="overflow-hidden rounded-xl border border-[var(--c-ecebe7)]">
          <table className={tableBase}>
            <thead>
              <tr>
                <th className={headerCell}>Student</th>
                <th className={headerCell}>Level</th>
                <th className={headerCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.name} className="bg-[var(--c-ffffff)]">
                  <td className={bodyCell}>{row.name}</td>
                  <td className={bodyCell}>{row.level}</td>
                  <td className={bodyCell}>
                    <span className="rounded-full bg-[var(--c-f1f1ef)] px-3 py-1 text-xs text-[var(--c-5b5952)]">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function UnpaidRoyaltiesTable() {
  const rows = [
    { teacher: 'Studio 18 • J. Lewis', amount: '$1,420', due: 'Feb 10' },
    { teacher: 'Studio 03 • R. Patel', amount: '$980', due: 'Feb 12' },
    { teacher: 'Studio 21 • M. Chen', amount: '$760', due: 'Feb 15' },
    { teacher: 'Studio 07 • L. Nguyen', amount: '$640', due: 'Feb 18' },
  ];

  return (
    <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm">
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Un-Paid Teacher Royalties
          </p>
          <h3 className="text-lg font-semibold text-[var(--c-1f1f1d)] mt-2">
            Current Month
          </h3>
        </div>
        <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
          $6,480 Due
        </span>
      </div>
      <div className="px-6 pb-6 pt-4">
        <div className="overflow-hidden rounded-xl border border-[var(--c-ecebe7)]">
          <table className={tableBase}>
            <thead>
              <tr>
                <th className={headerCell}>Teacher / Studio</th>
                <th className={headerCell}>Amount</th>
                <th className={headerCell}>Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.teacher} className="bg-[var(--c-ffffff)]">
                  <td className={bodyCell}>{row.teacher}</td>
                  <td className={bodyCell}>{row.amount}</td>
                  <td className={bodyCell}>{row.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
