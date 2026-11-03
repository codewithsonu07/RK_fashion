import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { admin } from '../api';
import { Btn, ErrorNote, ImageListEditor, Input, PageHeader, Panel, useLoad } from '../ui';
import { useContentEditor } from '../useContentEditor';
import { OCCASION_LABELS } from '../../lib/catalog';

const RULES = { newArrival: 'All “New arrival” products', readyToShip: 'All “Ready to ship” products', customisable: 'All customisable products' };
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function Catalogue() {
  const { draft, update, save, state } = useContentEditor(['categories', 'collections']);
  const { data } = useLoad(() => admin.products());
  const counts = useMemo(() => {
    const m = {};
    for (const p of data?.products || []) {
      m[`${p.gender}:${p.category}`] = (m[`${p.gender}:${p.category}`] || 0) + 1;
      for (const c of p.collections) m[`col:${c}`] = (m[`col:${c}`] || 0) + 1;
    }
    return m;
  }, [data]);

  const move = (list, i, d) => ([list[i], list[i + d]] = [list[i + d], list[i]]);

  return (
    <>
      <PageHeader
        title="Categories & Collections"
        text="Rename, reorder, add or remove the categories in the menus and the collections shown across the site."
        actions={
          <Btn onClick={save} disabled={state.busy || !state.dirty}>
            {state.busy ? 'Saving…' : 'Save Changes'}
          </Btn>
        }
      />
      {state.msg && <p className="mb-4 text-[13px] text-gold-dark" role="status">{state.msg}</p>}
      <ErrorNote error={state.error} />

      <div className="mt-4 grid gap-6 xl:grid-cols-2">
        {['women', 'men'].map((g) => (
          <Panel key={g} title={`${g === 'women' ? "Women's" : "Men's"} categories`}>
            <ul className="divide-y divide-line">
              {draft.categories[g].map((c, i) => {
                const count = c.occasion ? null : counts[`${g}:${c.slug}`] || 0;
                return (
                  <li key={c.slug + i} className="flex flex-wrap items-center gap-2 py-2.5">
                    <input value={c.label} onChange={(e) => update((d) => (d.categories[g][i].label = e.target.value))} className="field-box min-w-40 flex-1 py-1.5 text-[14px]" aria-label="Category name" />
                    <select
                      value={c.occasion || ''}
                      onChange={(e) =>
                        update((d) => {
                          if (e.target.value) d.categories[g][i].occasion = e.target.value;
                          else delete d.categories[g][i].occasion;
                        })
                      }
                      className="field-box w-auto py-1.5 text-[12px]"
                      aria-label="Category type"
                    >
                      <option value="">Garment type</option>
                      {Object.entries(OCCASION_LABELS).map(([k, l]) => (
                        <option key={k} value={k}>
                          Occasion: {l}
                        </option>
                      ))}
                    </select>
                    <span className="w-16 text-right text-[12px] text-muted">{count === null ? '' : `${count} items`}</span>
                    <IconBtn label="Move up" disabled={i === 0} onClick={() => update((d) => move(d.categories[g], i, -1))}>
                      <ArrowUp size={13} />
                    </IconBtn>
                    <IconBtn label="Move down" disabled={i === draft.categories[g].length - 1} onClick={() => update((d) => move(d.categories[g], i, 1))}>
                      <ArrowDown size={13} />
                    </IconBtn>
                    <IconBtn
                      label={count ? 'Move its products to another category before removing' : 'Remove category'}
                      disabled={!!count}
                      onClick={() => update((d) => d.categories[g].splice(i, 1))}
                    >
                      <Trash2 size={13} />
                    </IconBtn>
                  </li>
                );
              })}
            </ul>
            <AddRow
              placeholder="New category, e.g. Shararas"
              onAdd={(label) =>
                update((d) => {
                  const slug = slugify(label);
                  if (slug && !d.categories[g].some((c) => c.slug === slug)) d.categories[g].push({ slug, label });
                })
              }
            />
          </Panel>
        ))}
      </div>

      <Panel title="Collections" className="mt-6">
        <ul className="space-y-4">
          {draft.collections.map((c, i) => {
            const rule = Object.keys(c.match || {}).find((k) => k !== 'collection');
            return (
              <li key={c.slug} className="grid gap-4 border border-line p-4 md:grid-cols-[96px_1fr_auto]">
                <ImageListEditor single images={c.image ? [c.image] : []} onChange={(v) => update((d) => (d.collections[i].image = v[0] || ''))} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Title" value={c.title} onChange={(e) => update((d) => (d.collections[i].title = e.target.value))} />
                  <div>
                    <span className="label-caps mb-1.5 block text-muted">Includes</span>
                    <p className="py-2 text-[13px]">
                      {rule ? RULES[rule] : `Products tagged “${c.title}” (${counts[`col:${c.match?.collection}`] || 0})`}
                    </p>
                  </div>
                  <Input label="Subtitle" as="textarea" rows={2} value={c.subtitle} onChange={(e) => update((d) => (d.collections[i].subtitle = e.target.value))} className="sm:col-span-2" />
                  <p className="text-[12px] text-muted sm:col-span-2">Page: /collections/{c.slug}</p>
                </div>
                <div className="flex gap-1 md:flex-col">
                  <IconBtn label="Move up" disabled={i === 0} onClick={() => update((d) => move(d.collections, i, -1))}>
                    <ArrowUp size={13} />
                  </IconBtn>
                  <IconBtn label="Move down" disabled={i === draft.collections.length - 1} onClick={() => update((d) => move(d.collections, i, 1))}>
                    <ArrowDown size={13} />
                  </IconBtn>
                  <IconBtn label="Remove collection" onClick={() => window.confirm(`Remove the ${c.title}? Products keep their other collections.`) && update((d) => d.collections.splice(i, 1))}>
                    <Trash2 size={13} />
                  </IconBtn>
                </div>
              </li>
            );
          })}
        </ul>
        <AddRow
          placeholder="New collection, e.g. Summer Linen Edit"
          onAdd={(title) =>
            update((d) => {
              const slug = slugify(title);
              if (slug && !d.collections.some((c) => c.slug === slug))
                d.collections.push({ slug, title, subtitle: '', image: '', match: { collection: slug } });
            })
          }
        />
        <p className="mt-2 text-[12px] text-muted">After adding a collection, tick it on each product in Products → Edit → Collections.</p>
      </Panel>
    </>
  );
}

function IconBtn({ label, children, ...props }) {
  return (
    <button type="button" title={label} aria-label={label} {...props} className="p-1.5 text-muted hover:text-ink disabled:opacity-25">
      {children}
    </button>
  );
}

function AddRow({ placeholder, onAdd }) {
  const [v, setV] = useState('');
  return (
    <div className="mt-3 flex gap-2">
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className="field-box flex-1 py-1.5 text-[14px]" />
      <Btn
        small
        variant="outline"
        disabled={!v.trim()}
        onClick={() => {
          onAdd(v.trim());
          setV('');
        }}
      >
        <Plus size={12} /> Add
      </Btn>
    </div>
  );
}
