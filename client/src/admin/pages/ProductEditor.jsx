import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { admin } from '../api';
import { Btn, ErrorNote, ImageListEditor, Input, Loading, PageHeader, Panel, Toggle } from '../ui';
import { categories, collections } from '../../data/site';
import { OCCASION_LABELS } from '../../lib/catalog';

const SIZE_PRESETS = {
  'Women XS–XXL': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Men S–XXL': ['S', 'M', 'L', 'XL', 'XXL'],
  'Chest 36–46': ['36', '38', '40', '42', '44', '46'],
  'Waist 30–40': ['30', '32', '34', '36', '38', '40'],
};

const blank = {
  name: '',
  gender: 'women',
  category: '',
  price: '',
  stock: 5,
  images: [],
  sizes: SIZE_PRESETS['Women XS–XXL'],
  colours: [{ name: '', hex: '#C6A770' }],
  collections: [],
  occasions: [],
  description: '',
  fabric: '',
  craft: '',
  care: 'Dry clean only. Store folded in the muslin garment bag provided.',
  delivery: 'Made to order. Crafted in our atelier and dispatched in 4–6 weeks.',
  customisable: true,
  readyToShip: false,
  newArrival: true,
  bestSeller: false,
  published: true,
};

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [p, setP] = useState(isNew ? blank : null);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: 'idle', error: null, saved: false });

  useEffect(() => {
    if (isNew) return;
    admin
      .products()
      .then(({ products }) => {
        const found = products.find((x) => x._id === id);
        if (!found) throw new Error('Product not found.');
        setP({ ...blank, ...found, colours: found.colours?.length ? found.colours : blank.colours });
      })
      .catch(setLoadError);
  }, [id, isNew]);

  if (loadError) return <ErrorNote error={loadError} />;
  if (!p) return <Loading />;

  const set = (k, v) => {
    setP((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setState((s) => ({ ...s, saved: false }));
  };
  const toggleIn = (k, v) => set(k, p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v]);
  const tagCollections = collections.filter((c) => c.match?.collection);
  const occasionList = Object.keys(OCCASION_LABELS);

  const save = async () => {
    setState({ status: 'saving', error: null, saved: false });
    setErrors({});
    const body = { ...p, price: Number(p.price), stock: Number(p.stock), colours: p.colours.filter((c) => c.name.trim()) };
    try {
      if (isNew) {
        const { product } = await admin.createProduct(body);
        navigate(`/admin/products/${product._id}`, { replace: true });
      } else {
        const { product } = await admin.updateProduct(id, body);
        setP({ ...blank, ...product });
      }
      setState({ status: 'idle', error: null, saved: true });
    } catch (e) {
      setErrors(e.fields || {});
      setState({ status: 'idle', error: e, saved: false });
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remove “${p.name}”? Products that have been ordered are hidden instead of deleted.`)) return;
    try {
      const r = await admin.deleteProduct(id);
      if (r.archived) {
        setP({ ...p, published: false });
        setState({ status: 'idle', error: null, saved: false });
        window.alert('This product appears in past orders, so it has been hidden from the shop instead of deleted.');
      } else navigate('/admin/products');
    } catch (e) {
      setState({ status: 'idle', error: e, saved: false });
    }
  };

  return (
    <>
      <Link to="/admin/products" className="label-caps mb-4 inline-flex items-center gap-2 text-muted hover:text-ink">
        <ArrowLeft size={14} /> All products
      </Link>
      <PageHeader
        title={isNew ? 'Add Product' : p.name || 'Edit Product'}
        text={!isNew && p.slug ? `/product/${p.slug}` : undefined}
        actions={
          <>
            {!isNew && (
              <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 text-[12px] underline underline-offset-4">
                View in shop
              </a>
            )}
            <Btn onClick={save} disabled={state.status === 'saving'}>
              {state.status === 'saving' ? 'Saving…' : isNew ? 'Create Product' : 'Save Changes'}
            </Btn>
          </>
        }
      />
      {state.saved && <p className="mb-4 text-[13px] text-gold-dark" role="status">Saved.</p>}
      <ErrorNote error={state.error} />

      <div className="mt-4 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Name *" value={p.name} onChange={(e) => set('name', e.target.value)} error={errors.name} className="sm:col-span-2" />
              <Input label="For *" as="select" value={p.gender} 
                onChange={(e) => {
                  set('gender', e.target.value);
                  set('category', '');
                }}
                error={errors.gender}
              >
                <option value="women">Women</option>
                <option value="men">Men</option>
              </Input>
              <Input label="Category *" as="select" value={p.category} onChange={(e) => set('category', e.target.value)} error={errors.category}>
                <option value="">Choose…</option>
                {categories[p.gender].filter((c) => !c.occasion).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </Input>
              <Input label="Price (₹) *" type="number" min="1" value={p.price} onChange={(e) => set('price', e.target.value)} error={errors.price} />
              <Input label="Stock (units)" type="number" min="0" value={p.stock} onChange={(e) => set('stock', e.target.value)} />
              <Input label="Description" as="textarea" rows={4} value={p.description} onChange={(e) => set('description', e.target.value)} className="sm:col-span-2" />
              <Input label="Fabric" as="textarea" rows={2} value={p.fabric} onChange={(e) => set('fabric', e.target.value)} />
              <Input label="Craftsmanship" as="textarea" rows={2} value={p.craft} onChange={(e) => set('craft', e.target.value)} />
              <Input label="Care" value={p.care} onChange={(e) => set('care', e.target.value)} />
              <Input label="Delivery information" value={p.delivery} onChange={(e) => set('delivery', e.target.value)} />
            </div>
          </Panel>

          <Panel title="Images *">
            <ImageListEditor images={p.images} onChange={(v) => set('images', v)} />
            <p className="mt-2 text-[12px] text-muted">The first image is the main photo. Portrait images (3:4) look best.</p>
            {errors.images && <p className="mt-1 text-[12px] text-error">{errors.images}</p>}
          </Panel>

          <Panel title="Sizes & colours">
            <p className="label-caps mb-2 text-muted">Sizes *</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {Object.entries(SIZE_PRESETS).map(([label, sizes]) => (
                <Btn key={label} small variant="outline" onClick={() => set('sizes', sizes)}>
                  {label}
                </Btn>
              ))}
            </div>
            <Input value={p.sizes.join(', ')} onChange={(e) => set('sizes', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} hint="Comma-separated, e.g. S, M, L" error={errors.sizes} />
            <p className="label-caps mb-2 mt-6 text-muted">Colours</p>
            <div className="space-y-2">
              {p.colours.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={c.hex} onChange={(e) => set('colours', p.colours.map((x, j) => (j === i ? { ...x, hex: e.target.value.toUpperCase() } : x)))} className="h-9 w-10 cursor-pointer border border-sand bg-transparent" aria-label="Colour swatch" />
                  <input value={c.name} onChange={(e) => set('colours', p.colours.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Colour name, e.g. Bridal Red" className="field-box flex-1 py-2 text-[14px]" />
                  <button type="button" onClick={() => set('colours', p.colours.filter((_, j) => j !== i))} className="p-2 text-muted hover:text-error" aria-label="Remove colour">
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
            <Btn small variant="ghost" className="mt-2" onClick={() => set('colours', [...p.colours, { name: '', hex: '#C6A770' }])}>
              <Plus size={13} /> Add colour
            </Btn>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Visibility & labels">
            <div className="space-y-4">
              <Toggle label="Published in the shop" checked={p.published} onChange={(v) => set('published', v)} />
              <Toggle label="New arrival" checked={p.newArrival} onChange={(v) => set('newArrival', v)} />
              <Toggle label="Best seller" checked={p.bestSeller} onChange={(v) => set('bestSeller', v)} />
              <Toggle label="Ready to ship" checked={p.readyToShip} onChange={(v) => set('readyToShip', v)} />
              <Toggle label="Can be customised (shows “Custom Size” & “Request Customisation”)" checked={p.customisable} onChange={(v) => set('customisable', v)} />
            </div>
          </Panel>
          <Panel title="Collections">
            <div className="flex flex-wrap gap-2">
              {tagCollections.map((c) => (
                <Chip key={c.slug} on={p.collections.includes(c.match.collection)} onClick={() => toggleIn('collections', c.match.collection)}>
                  {c.title}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-muted">New Arrivals, Ready-to-Ship and Bespoke collections follow the labels above automatically.</p>
          </Panel>
          <Panel title="Occasions">
            <div className="flex flex-wrap gap-2">
              {occasionList.map((o) => (
                <Chip key={o} on={p.occasions.includes(o)} onClick={() => toggleIn('occasions', o)}>
                  {OCCASION_LABELS[o]}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-muted">Occasions power the Bridal, Wedding, Festive and Casual Wear pages and filters.</p>
          </Panel>
          {!isNew && (
            <Panel title="Remove">
              <Btn variant="danger" small onClick={remove}>
                Delete product
              </Btn>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function Chip({ on, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`border px-3 py-1.5 text-[12px] transition-colors ${on ? 'border-ink bg-ink text-ivory' : 'border-sand hover:border-ink'}`}>
      {children}
    </button>
  );
}
