import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items, light = false }) {
  return (
    <nav aria-label="Breadcrumb" className={`label-caps ${light ? 'text-ivory/80' : 'text-muted'}`}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {item.to ? (
              <Link to={item.to} className={`transition-colors ${light ? 'hover:text-ivory' : 'hover:text-ink'}`}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={light ? 'text-ivory' : 'text-ink'}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
