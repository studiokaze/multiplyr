/**
 * Wordmark. The glyph is two offset chevrons — the pipeline's fork between
 * build and kill — drawn rather than imported so it stays crisp at any size
 * and needs no asset pipeline.
 */
export default function Mark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M2.5 3.5L6.5 8L2.5 12.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 12.5H13.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
      <span className="text-[13.5px] font-medium tracking-[-0.01em]">
        Multiplyer
      </span>
    </span>
  );
}
