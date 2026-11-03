export function LoadingGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-[3/4] animate-pulse bg-beige" />
          <div className="mt-4 h-4 w-3/4 animate-pulse bg-beige" />
          <div className="mt-2 h-3 w-1/3 animate-pulse bg-beige" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center" role="alert">
      <p className="font-serif text-2xl">We couldn’t load the collection.</p>
      <p className="mt-3 text-sm text-muted">{error?.message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline mt-8">
          Try again
        </button>
      )}
    </div>
  );
}
