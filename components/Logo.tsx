export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight text-zinc-900 ${className}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <rect width="24" height="24" rx="6" fill="#18181b" />
        <path d="M7 17V7m10 10V7M7 12h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      helpBham
    </span>
  );
}
