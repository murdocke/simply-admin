export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-sm opacity-70">Active Students</p>
          <p className="text-3xl font-bold mt-2">42</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-sm opacity-70">Lessons Today</p>
          <p className="text-3xl font-bold mt-2">8</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <p className="text-sm opacity-70">Payments Due</p>
          <p className="text-3xl font-bold mt-2">$1,240</p>
        </div>
      </div>
    </>
  );
}
