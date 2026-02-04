type CartContext = 'company' | 'teacher' | 'student';

type CartPanelProps = {
  context: CartContext;
};

const cartCopy: Record<
  CartContext,
  { title: string; subtitle: string; cta: string }
> = {
  company: {
    title: 'Network Cart Monitor',
    subtitle: 'See active carts across studios and cohorts.',
    cta: 'Review all carts',
  },
  teacher: {
    title: 'Teacher Cart',
    subtitle: 'Materials queued for your studio.',
    cta: 'Continue checkout',
  },
  student: {
    title: 'Student Cart',
    subtitle: 'Ready-to-order resources and lesson packs.',
    cta: 'Go to checkout',
  },
};

const cartItems: Record<
  CartContext,
  Array<{ name: string; detail: string; price: string }>
> = {
  company: [
    { name: 'Foundation Program', detail: '3 carts', price: '$540' },
    { name: 'Special Programs', detail: '5 carts', price: '$1,125' },
    { name: 'Development Program', detail: '4 carts', price: '$760' },
    { name: 'Supplemental Programs', detail: '7 carts', price: '$315' },
    { name: 'Simply Music Gateway', detail: '2 carts', price: '$280' },
    { name: 'Extras', detail: '9 carts', price: '$190' },
    { name: 'Licensing & Teacher Status', detail: '1 cart', price: '$420' },
  ],
  teacher: [
    { name: 'Foundation Program', detail: 'Qty 2', price: '$220' },
    { name: 'Special Programs', detail: 'Qty 1', price: '$180' },
    { name: 'Development Program', detail: 'Qty 1', price: '$160' },
    { name: 'Supplemental Programs', detail: 'Qty 3', price: '$135' },
    { name: 'Simply Music Gateway', detail: 'Qty 1', price: '$95' },
    { name: 'Extras', detail: 'Qty 2', price: '$45' },
    { name: 'Licensing & Teacher Status', detail: 'Qty 1', price: '$250' },
  ],
  student: [
    { name: 'Foundation Program', detail: 'Qty 1', price: '$110' },
    { name: 'Special Programs', detail: 'Qty 1', price: '$95' },
    { name: 'Development Program', detail: 'Qty 1', price: '$120' },
    { name: 'Supplemental Programs', detail: 'Qty 2', price: '$70' },
    { name: 'Simply Music Gateway', detail: 'Qty 1', price: '$85' },
    { name: 'Extras', detail: 'Qty 1', price: '$30' },
    { name: 'Licensing & Teacher Status', detail: 'Qty 1', price: '$200' },
  ],
};

const cartTotals: Record<CartContext, { subtotal: string; items: string }> = {
  company: { subtotal: '$1,980', items: '15 active carts' },
  teacher: { subtotal: '$445', items: '4 items' },
  student: { subtotal: '$211', items: '3 items' },
};

export default function CartPanel({ context }: CartPanelProps) {
  const copy = cartCopy[context];
  const items = cartItems[context];
  const total = cartTotals[context];

  return (
    <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
            Cart
          </p>
          <h2 className="text-lg font-semibold text-[#1f1f1d] mt-2">
            {copy.title}
          </h2>
          <p className="text-sm text-[#6f6c65] mt-1">{copy.subtitle}</p>
        </div>
        <div className="rounded-full border border-[#ecebe7] bg-[#fcfcfb] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#6f6c65]">
          {total.items}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map(item => (
          <div
            key={item.name}
            className="flex flex-col gap-2 rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935] md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-medium text-[#1f1f1d]">{item.name}</p>
              <p className="text-xs text-[#6f6c65]">{item.detail}</p>
            </div>
            <div className="text-sm font-semibold text-[#1f1f1d]">
              {item.price}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-[#6f6c65]">
          Subtotal <span className="font-semibold text-[#1f1f1d]">{total.subtotal}</span>
        </div>
        <button className="rounded-full bg-[#c8102e] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110">
          {copy.cta}
        </button>
      </div>
    </section>
  );
}
