/**
 * The Multiplyer mark: an isometric cube whose two front faces are cut into
 * an M, with the lid separated by a hairline gap above it.
 *
 * Drawn rather than imported so it stays crisp at any size, needs no asset
 * pipeline, and recolours with currentColor on every surface.
 */

/** Lid: the isometric rhombus, floating just above the body. */
const LID = "M32 2 L58 16 L32 30 L6 16 Z";

/**
 * Body: left face, a valley cut up the middle to form the M, right face.
 * (32,34) is the cube's front vertical edge and the two feet are angled, so
 * the solid reads as isometric rather than as a flat letter.
 */
const BODY =
  "M6 20 L6 44 L16 49.5 L16 34 L32 43 L48 34 L48 49.5 L58 44 L58 20 L32 34 Z";

export function MarkGlyph({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={LID} />
      <path d={BODY} />
    </svg>
  );
}

export default function Mark({
  className = "",
  size = 20,
  wordmark = true,
}: {
  className?: string;
  size?: number;
  wordmark?: boolean;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <MarkGlyph size={size} />
      {/* Uppercase and tracked wide, matching the lockup's engineered look. */}
      {wordmark && (
        <span className="text-[12.5px] font-semibold uppercase tracking-[0.22em]">
          Multiplyer
        </span>
      )}
    </span>
  );
}
