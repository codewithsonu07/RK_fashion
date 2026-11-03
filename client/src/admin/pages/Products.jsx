import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { admin } from '../api';
import { Badge, Btn, ErrorNote, Loading, PageHeader, useLoad } from '../ui';
import { categoryLabel } from '../../lib/catalog';
import { formatPrice } from '../../lib/format';
import { img } from '../../lib/image';

export default function Products() {
  const { status, data, error, setData } = useLoad(() => admin.products());
  const [q, setQ] = useState('');
  const [gender, setGender] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [msg, setMsg] = useState(null);

  const products = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.products || []).filter(
      (p) =>
        (!gender || p.gender === gender) &&
        (!stockFilter || (stockFilter === 'low' ? p.stock <= 2 : stockFilter === 'hidden' ? !p.published : true)) &&
        (!term || `${p.name} ${p.category} ${p.slug}`.toLowerCase().includes(term)),
    );
  }, [data, q, gender, stockFilter]);

  const patch = async (p, body) => {
    setMsg(null);
    try {
      const { product } = await admin.updateProduct(p._id, body);
      setData({ products: data.products.map((x) => (x._id === p._id ? product : x)) });
      setMsg({ ok: true, text: `Saved ${product.name}.` });
    } catch (e) {
      setMsg({ ok: false, text: e.fields ? Object.values(e.fields)[0] : e.message });
    }
  };

  return (
    <>
      <PageHeader
        title="Products & Inventory"
        text={data ? `${data.products.length} products · ${data.products.filter((p) => p.published).length} published` : undefined}
        actions={
          <Link to="/admin/products/new" className="inline-flex items-center gap-2 bg-ink px-5 py-2.5 text-[11px] uppercase tracking-[0.16em] text-ivory hover:bg-gold-dark">
            <Plus size={14} /> Add Product
          </Link>
        }
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="field-box py-2 pl-9 text-[14px]" aria-label="Search products" />
        </label>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="field-box w-auto py-2 text-[13px]" aria-label="Filter by gender">
          <option value="">Women & Men</option>
          <option value="women">Women</option>
          <option value="men">Men</option>
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="field-box w-auto py-2 text-[13px]" aria-label="Filter by stock">
          <option value="">All</option>
          <option value="low">Low stock (≤ 2)</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>
      {msg && <p className={`mb-4 text-[13px] ${msg.ok ? 'text-gold-dark' : 'text-error'}`} role="status">{msg.text}</p>}
      {status === 'loading' && <Loading />}
      <ErrorNote error={error} />
      {data && (
        <div className="overflow-x-auto border border-line bg-white/60">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="border-b border-line bg-beige/60">
              <tr>
                {['Product', 'Category', 'Price (₹)', 'Stock', 'Flags', 'Visible', ''].map((h) => (
                  <th key={h} className="label-caps px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p._id} className={p.published ? '' : 'opacity-60'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={img(p.images[0], 80, 106)} alt="" className="h-14 w-10 shrink-0 bg-beige object-cover" />
                      <div>
                        <Link to={`/admin/products/${p._id}`} className="font-serif text-[17px] hover:text-gold-dark">
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-muted">{formatPrice(p.price)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {p.gender === 'women' ? 'Women' : 'Men'} · {categoryLabel(p.gender, p.category)}
                  </td>
                  <td className="px-4 py-3">
                    <InlineNumber value={p.price} min={1} onSave={(price) => patch(p, { price })} label={`Price of ${p.name}`} width="w-28" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <InlineNumber value={p.stock} min={0} onSave={(stock) => patch(p, { stock })} label={`Stock of ${p.name}`} width="w-16" />
                      {p.stock === 0 ? <Badge tone="red">Sold out</Badge> : p.stock <= 2 ? <Badge tone="gold">Low</Badge> : null}
                    </div>
                  </td>
                  <td className="space-x-1 px-4 py-3">
                    {p.newArrival && <Badge>New</Badge>}
                    {p.bestSeller && <Badge>Best</Badge>}
                    {p.readyToShip && <Badge>RTS</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => patch(p, { published: !p.published })}
                      className={`text-[12px] underline-offset-4 hover:underline ${p.published ? 'text-[#2f6b45]' : 'text-muted'}`}
                    >
                      {p.published ? 'Published' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/products/${p._id}`} className="text-[12px] underline underline-offset-4">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p className="p-8 text-center text-[13px] text-muted">No products match.</p>}
        </div>
      )}
    </>
  );
}

function InlineNumber({ value, onSave, min, label, width }) {
  const [v, setV] = useState(String(value));
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setV(String(value));
  }
  const dirty = Number(v) !== value && v !== '' && Number(v) >= min;
  return (
    <span className="flex items-center gap-1">
      <input
        type="number"
        min={min}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && dirty && onSave(Number(v))}
        aria-label={label}
        className={`field-box ${width} px-2 py-1 text-[13px]`}
      />
      {dirty && (
        <Btn small onClick={() => onSave(Number(v))}>
          Save
        </Btn>
      )}
    </span>
  );
}
