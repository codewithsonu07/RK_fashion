// Original RK FASHIONS wordmark: a serif "RK" monogram framed by champagne rules.
export default function Logo({ light = false, compact = false, className = '' }) {
  const ink = light ? 'text-ivory' : 'text-ink';
  return (
    <span className={`inline-flex flex-col items-center leading-none ${ink} ${className}`} aria-label="RK FASHIONS">
      <span className="flex items-center gap-3">
        <span className="hidden h-px w-6 bg-champagne sm:block" aria-hidden />
        <span className={`font-serif font-medium tracking-[0.18em] ${compact ? 'text-[26px]' : 'text-[30px] sm:text-[36px]'}`}>RK</span>
        <span className="hidden h-px w-6 bg-champagne sm:block" aria-hidden />
      </span>
      <span className={`mt-1 font-sans text-[9px] font-normal tracking-[0.62em] ${compact ? '' : 'sm:text-[10px]'} pl-[0.62em]`}>
        FASHIONS
      </span>
    </span>
  );
}
