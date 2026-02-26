import Image from "next/image";
import Link from "next/link";

const teacherImages = [
  {
    src: "/reference/qr-teacher-1.png",
    label: "Teacher QR Example 1",
    detail: "Teacher shares invite code",
  },
  {
    src: "/reference/qr-teacher-2.png",
    label: "Teacher QR Example 2",
    detail: "Teacher confirms student pairing",
  },
];

const studentImages = [
  {
    src: "/reference/qr-student-1.png",
    label: "Student QR Example 1",
    detail: "Student opens scan screen",
  },
  {
    src: "/reference/qr-student-2.png",
    label: "Student QR Example 2",
    detail: "Student scans teacher code",
  },
  {
    src: "/reference/qr-student-3.png",
    label: "Student QR Example 3",
    detail: "Student confirms teacher link",
    showOverlayQr: true,
  },
  {
    src: "/reference/qr-student-4.png",
    label: "Student QR Example 4",
    detail: "Student sees linked teacher profile",
  },
];

function QrCard({
  src,
  label,
  detail,
  showOverlayQr,
}: {
  src: string;
  label: string;
  detail: string;
  showOverlayQr?: boolean;
}) {
  return (
    <article className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)]">
        <Image
          src={src}
          alt={label}
          width={900}
          height={1600}
          sizes="(max-width: 768px) 92vw, (max-width: 1280px) 45vw, 30vw"
          className="h-auto w-full"
          priority={false}
        />
        {showOverlayQr ? (
          <div className="pointer-events-none absolute left-1/2 top-[53%] z-20 w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-neutral-700 bg-white p-2 shadow-[0_14px_26px_-14px_rgba(0,0,0,0.55)]">
            <div className="aspect-square w-full rounded-sm border border-neutral-300 bg-white p-1">
              <svg
                viewBox="0 0 21 21"
                className="h-full w-full"
                aria-hidden="true"
                shapeRendering="crispEdges"
              >
                <rect x="0" y="0" width="21" height="21" fill="#fff" />
                <g stroke="#d4d4d4" strokeWidth="0.35">
                  <line x1="1" y1="0" x2="1" y2="21" />
                  <line x1="3" y1="0" x2="3" y2="21" />
                  <line x1="5" y1="0" x2="5" y2="21" />
                  <line x1="7" y1="0" x2="7" y2="21" />
                  <line x1="9" y1="0" x2="9" y2="21" />
                  <line x1="11" y1="0" x2="11" y2="21" />
                  <line x1="13" y1="0" x2="13" y2="21" />
                  <line x1="15" y1="0" x2="15" y2="21" />
                  <line x1="17" y1="0" x2="17" y2="21" />
                  <line x1="19" y1="0" x2="19" y2="21" />
                </g>
                <rect x="1.6" y="0.8" width="0.8" height="4.2" fill="#111" />
                <rect x="3.6" y="0.8" width="0.8" height="4.2" fill="#111" />
                <rect x="7.6" y="0.8" width="0.8" height="4.2" fill="#111" />
                <rect x="9.6" y="0.8" width="0.8" height="4.2" fill="#111" />
                <rect x="11.6" y="0.8" width="0.8" height="4.2" fill="#111" />
                <rect x="15.6" y="0.8" width="0.8" height="4.2" fill="#111" />
                <rect x="17.6" y="0.8" width="0.8" height="4.2" fill="#111" />

                <rect x="0" y="0" width="7" height="7" fill="#111" />
                <rect x="1" y="1" width="5" height="5" fill="#fff" />
                <rect x="2" y="2" width="3" height="3" fill="#111" />

                <rect x="14" y="0" width="7" height="7" fill="#111" />
                <rect x="15" y="1" width="5" height="5" fill="#fff" />
                <rect x="16" y="2" width="3" height="3" fill="#111" />

                <rect x="0" y="14" width="7" height="7" fill="#111" />
                <rect x="1" y="15" width="5" height="5" fill="#fff" />
                <rect x="2" y="16" width="3" height="3" fill="#111" />

                <rect x="6" y="7" width="1" height="1" fill="#111" />
                <rect x="7" y="7" width="1" height="1" fill="#111" />
                <rect x="13" y="7" width="1" height="1" fill="#111" />
                <rect x="14" y="7" width="1" height="1" fill="#111" />

                <rect x="8" y="2" width="1" height="1" fill="#111" />
                <rect x="10" y="2" width="1" height="1" fill="#111" />
                <rect x="12" y="2" width="1" height="1" fill="#111" />
                <rect x="8" y="4" width="1" height="1" fill="#111" />
                <rect x="9" y="5" width="1" height="1" fill="#111" />
                <rect x="10" y="4" width="1" height="1" fill="#111" />
                <rect x="12" y="5" width="1" height="1" fill="#111" />
                <rect x="8" y="8" width="1" height="1" fill="#111" />
                <rect x="9" y="8" width="1" height="1" fill="#111" />
                <rect x="11" y="8" width="1" height="1" fill="#111" />
                <rect x="13" y="8" width="1" height="1" fill="#111" />
                <rect x="7" y="9" width="1" height="1" fill="#111" />
                <rect x="9" y="9" width="1" height="1" fill="#111" />
                <rect x="10" y="9" width="1" height="1" fill="#111" />
                <rect x="12" y="9" width="1" height="1" fill="#111" />
                <rect x="14" y="9" width="1" height="1" fill="#111" />
                <rect x="8" y="10" width="1" height="1" fill="#111" />
                <rect x="10" y="10" width="1" height="1" fill="#111" />
                <rect x="11" y="10" width="1" height="1" fill="#111" />
                <rect x="13" y="10" width="1" height="1" fill="#111" />
                <rect x="7" y="11" width="1" height="1" fill="#111" />
                <rect x="9" y="11" width="1" height="1" fill="#111" />
                <rect x="12" y="11" width="1" height="1" fill="#111" />
                <rect x="14" y="11" width="1" height="1" fill="#111" />
                <rect x="8" y="12" width="1" height="1" fill="#111" />
                <rect x="10" y="12" width="1" height="1" fill="#111" />
                <rect x="11" y="12" width="1" height="1" fill="#111" />
                <rect x="13" y="12" width="1" height="1" fill="#111" />
                <rect x="15" y="12" width="1" height="1" fill="#111" />
                <rect x="8" y="13" width="1" height="1" fill="#111" />
                <rect x="9" y="13" width="1" height="1" fill="#111" />
                <rect x="12" y="13" width="1" height="1" fill="#111" />
                <rect x="14" y="13" width="1" height="1" fill="#111" />
                <rect x="16" y="13" width="1" height="1" fill="#111" />
                <rect x="8" y="15" width="1" height="1" fill="#111" />
                <rect x="9" y="15" width="1" height="1" fill="#111" />
                <rect x="11" y="15" width="1" height="1" fill="#111" />
                <rect x="13" y="15" width="1" height="1" fill="#111" />
                <rect x="15" y="15" width="1" height="1" fill="#111" />
                <rect x="9" y="16" width="1" height="1" fill="#111" />
                <rect x="10" y="16" width="1" height="1" fill="#111" />
                <rect x="12" y="16" width="1" height="1" fill="#111" />
                <rect x="14" y="16" width="1" height="1" fill="#111" />
                <rect x="16" y="16" width="1" height="1" fill="#111" />
                <rect x="8" y="17" width="1" height="1" fill="#111" />
                <rect x="10" y="17" width="1" height="1" fill="#111" />
                <rect x="11" y="17" width="1" height="1" fill="#111" />
                <rect x="13" y="17" width="1" height="1" fill="#111" />
                <rect x="15" y="17" width="1" height="1" fill="#111" />
                <rect x="9" y="18" width="1" height="1" fill="#111" />
                <rect x="12" y="18" width="1" height="1" fill="#111" />
                <rect x="14" y="18" width="1" height="1" fill="#111" />
                <rect x="8" y="19" width="1" height="1" fill="#111" />
                <rect x="10" y="19" width="1" height="1" fill="#111" />
                <rect x="13" y="19" width="1" height="1" fill="#111" />
              </svg>
            </div>
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--c-6f6c65)]">{detail}</p>
    </article>
  );
}

export default function QrExamplePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--c-c8102e)]">
          QR Interaction Demo
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Teacher + Student Mobile Linking
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--c-6f6c65)]">
          Quick visual flow showing how a teacher and student pair accounts using
          QR codes on mobile devices.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--c-6f6c65)]">
            9:16 Mockups
          </span>
          <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--c-6f6c65)]">
            Responsive Gallery
          </span>
          <Link
            href="/dashboard"
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
          >
            Back To Dashboard
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--c-c8102e)]">
          Teacher Views
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {teacherImages.map(image => (
            <QrCard
              key={image.src}
              src={image.src}
              label={image.label}
              detail={image.detail}
              showOverlayQr={image.showOverlayQr}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--c-c8102e)]">
          Student Views
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {studentImages.map(image => (
            <QrCard
              key={image.src}
              src={image.src}
              label={image.label}
              detail={image.detail}
              showOverlayQr={image.showOverlayQr}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
