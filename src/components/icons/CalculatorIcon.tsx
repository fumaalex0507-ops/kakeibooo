export function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" />
      <rect x="4.3" y="3.3" width="7.4" height="2.6" rx="0.5" fill="currentColor" stroke="none" />
      <circle cx="4.6" cy="8.4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8.4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="11.4" cy="8.4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="4.6" cy="11.2" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="8" cy="11.2" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="11.4" cy="11.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
