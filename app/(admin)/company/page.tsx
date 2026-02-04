import CartPanel from '../components/cart-panel';

export default function CompanyPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
            Company
          </p>
          <h1 className="text-3xl font-semibold text-[#1f1f1d] mt-2">
            Internal Operations
          </h1>
          <p className="text-sm text-[#6f6c65] mt-2">
            Everything you need to run the Simply Music network in one place.
          </p>
        </div>
        <div className="rounded-full border border-[#ecebe7] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#6f6c65] shadow-sm">
          Live Snapshot
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {[
          { label: 'Teachers', value: '214', note: 'Active in network' },
          { label: 'Students', value: '4,820', note: 'Across all studios' },
          { label: 'Orders', value: '1,126', note: 'Last 30 days' },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
              {item.label}
            </p>
            <p className="text-4xl font-semibold mt-3 text-[#1f1f1d]">
              {item.value}
            </p>
            <p className="text-sm text-[#6f6c65] mt-2">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1f1f1d]">
            Commerce &amp; Royalties
          </h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Track products, orders, and royalty flows.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              'Products in Carts',
              'Recent Orders',
              'Royalty Payments Due',
              'Royalty Payments Paid',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1f1f1d]">
            Search &amp; Support Chat
          </h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Quickly locate a teacher or student and start a thread.
          </p>
          <div className="mt-5 rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#6f6c65]">
            Search teachers or students...
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {[
              'Recent: Jessica L. • Studio 18',
              'Recent: Marco R. • Student',
              'Open Chat Queue (6)',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[#ecebe7] bg-white px-4 py-3 text-[#3a3935]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <CartPanel context="company" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-[#1f1f1d]">
            Lesson Pack Management
          </h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Manage lesson content across packs and levels.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              'Foundation Packs 1-9',
              'Special Programs',
              'Development Packs',
              'Seasonal Lessons',
              'Media Assets',
              'Release Calendar',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1f1f1d]">
            Team View
          </h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Browse teachers and students at a glance.
          </p>
          <div className="mt-5 space-y-3">
            {[
              'Teacher Directory',
              'Student Directory',
              'Studio Health',
              'Escalations',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
