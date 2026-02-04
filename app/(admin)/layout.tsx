export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-zinc-950 text-white">
      <aside className="w-64 bg-zinc-900 p-6">
        <h2 className="text-xl font-semibold mb-6">Simply Music</h2>
        <nav className="space-y-3 text-sm">
          <a href="/dashboard" className="block opacity-80 hover:opacity-100">
            Dashboard
          </a>
          <a href="/students" className="block opacity-80 hover:opacity-100">
            Students
          </a>
          <a href="/teachers" className="block opacity-80 hover:opacity-100">
            Teachers
          </a>
          <a href="/lessons" className="block opacity-80 hover:opacity-100">
            Lessons
          </a>
          <a href="/payments" className="block opacity-80 hover:opacity-100">
            Payments
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
