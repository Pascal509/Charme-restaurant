"use client";

type StarRatingDisplayProps = {
  rating: number;
};

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
};

type StarIconProps = {
  filled: boolean;
  interactive?: boolean;
};

export function StarRatingDisplay({ rating }: StarRatingDisplayProps) {
  const normalized = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon key={index} filled={index < normalized} />
      ))}
    </div>
  );
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1;
        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="rounded p-1"
            aria-label={`${rating} star`}
          >
            <StarIcon filled={rating <= value} interactive />
          </button>
        );
      })}
    </div>
  );
}

function StarIcon({ filled, interactive }: StarIconProps) {
  const color = filled ? "text-brand-ink" : "text-brand-ink/30";
  const hover = interactive ? "hover:text-brand-ink" : "";
  return (
    <svg
      className={`h-4 w-4 ${color} ${hover}`}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.75.75 0 011.04 0l2.485 2.375a.75.75 0 00.564.206l3.42-.2a.75.75 0 01.78.927l-.863 3.32a.75.75 0 00.216.703l2.49 2.288a.75.75 0 01-.415 1.294l-3.41.597a.75.75 0 00-.54.395l-1.52 2.997a.75.75 0 01-1.334 0l-1.52-2.997a.75.75 0 00-.54-.395l-3.41-.597a.75.75 0 01-.415-1.294l2.49-2.288a.75.75 0 00.216-.703l-.863-3.32a.75.75 0 01.78-.927l3.42.2a.75.75 0 00.564-.206l2.485-2.375z"
      />
    </svg>
  );
}

export function formatRatingLabel(average: number, count: number) {
  if (!count) return "No reviews";
  return `${average.toFixed(1)} (${count})`;
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
