import Reveal from './Reveal';

export default function SectionHeading({ eyebrow, title, text, align = 'center', light = false, className = '' }) {
  const centered = align === 'center';
  return (
    <Reveal className={`${centered ? 'mx-auto text-center' : ''} max-w-2xl ${className}`}>
      {eyebrow && <p className={`eyebrow mb-4 ${light ? 'text-champagne' : ''}`}>{eyebrow}</p>}
      <h2 className={`text-[34px] leading-[1.1] sm:text-[44px] ${light ? 'text-ivory' : ''}`}>{title}</h2>
      <span className={`mt-6 h-px w-14 bg-champagne ${centered ? 'mx-auto block' : 'block'}`} aria-hidden />
      {text && <p className={`mt-6 text-[15px] leading-relaxed ${light ? 'text-ivory/80' : 'text-muted'}`}>{text}</p>}
    </Reveal>
  );
}
