"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MenuItem } from "@/features/menu/types";
import ImageWrapper from "@/components/ui/ImageWrapper";
import {
  StarRatingDisplay,
  StarRatingInput,
  formatDate,
  formatRatingLabel
} from "@/features/menu/components/RatingStars";

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: { name?: string | null } | null;
};

type ReviewsResponse = {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  canReview: boolean;
  hasReviewed: boolean;
};

const blurData =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB2aWV3Qm94PSIwIDAgNCA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4=";

export default function ItemDetailModal({
  item,
  quantity,
  onQuantityChange,
  onClose,
  onConfirm
}: {
  item: MenuItem;
  quantity: number;
  onQuantityChange: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const queryClient = useQueryClient();
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const total = item.priceMinor * quantity;

  const reviewsQuery = useQuery<ReviewsResponse>({
    queryKey: ["reviews", item.id],
    staleTime: 60_000,
    queryFn: async () => {
      const response = await fetch(`/api/reviews?itemId=${item.id}`);
      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }
      return response.json();
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId: item.id,
          rating: reviewRating,
          comment: reviewComment.trim() ? reviewComment.trim() : undefined
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to submit review");
      }

      return payload as { review: Review };
    },
    onSuccess: () => {
      setReviewMessage("Thanks for your review.");
      setReviewError(null);
      setReviewRating(0);
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", item.id] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (error) => {
      setReviewError(error instanceof Error ? error.message : "Failed to submit review");
      setReviewMessage(null);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-brand-gold/10 bg-brand-obsidian shadow-crisp animate-soft-scale">
        <ImageWrapper
          src={item.imageUrl}
          alt={item.name}
          aspect="menu"
          sizes="(max-width: 768px) 100vw, 60vw"
          blurDataURL={blurData}
          className="w-full mb-6"
          objectPositionClassName={getMenuObjectPosition(item.name)}
          fallbackLabel="No image"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-brand-gold/30 bg-black/70 px-4 py-2 text-xs font-semibold text-brand-gold"
          >
            Close
          </button>
          <div className="absolute bottom-6 left-6">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-gold/80">Details</p>
            <h3 className="mt-2 font-display text-3xl text-brand-ink sm:text-4xl">
              {item.name}
            </h3>
          </div>
        </ImageWrapper>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {item.description ? (
                <p className="mt-2 text-sm text-brand-ink/70 sm:text-base">
                  {item.description}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-gold/70">From</p>
              <p className="text-lg font-semibold text-brand-gold">
                {formatCurrency(item.priceMinor, item.currency)}
              </p>
            </div>
          </div>

          {item.modifierGroups && item.modifierGroups.length > 0 ? (
            <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold/70">
                Modifiers
              </p>
              <div className="mt-4 space-y-3">
                {item.modifierGroups.map((group) => (
                  <div key={group.id} className="rounded-xl border border-brand-gold/10 px-3 py-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-brand-ink">
                      <span>{group.name}</span>
                      <span className="text-xs text-brand-ink/60">
                        {group.minSelect}-{group.maxSelect}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-brand-ink/60">
                      {group.options.map((option) => (
                        <span
                          key={option.id}
                          className="rounded-full border border-brand-gold/20 bg-black/40 px-3 py-1"
                        >
                          {option.name}
                          {option.priceMinor
                            ? ` +${formatCurrency(option.priceMinor, option.currency ?? item.currency)}`
                            : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-brand-ink/60">
                Select options after tapping Add to Cart.
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/70">
                  Reviews
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm text-brand-ink/70">
                  <StarRatingDisplay
                    rating={reviewsQuery.data?.averageRating ?? item.averageRating ?? 0}
                  />
                  <span>
                    {formatRatingLabel(
                      reviewsQuery.data?.averageRating ?? item.averageRating ?? 0,
                      reviewsQuery.data?.reviewCount ?? item.reviewCount ?? 0
                    )}
                  </span>
                </div>
              </div>
              {reviewsQuery.data?.hasReviewed ? (
                <span className="rounded-full border border-brand-gold/20 bg-black/40 px-3 py-1 text-xs text-brand-ink/70">
                  Review submitted
                </span>
              ) : null}
            </div>

            {reviewsQuery.isLoading ? (
              <p className="mt-3 text-xs text-brand-ink/60">Loading reviews...</p>
            ) : reviewsQuery.isError ? (
              <p className="mt-3 text-xs text-brand-cinnabar">Unable to load reviews.</p>
            ) : reviewsQuery.data?.reviews.length ? (
              <div className="mt-4 space-y-3">
                {reviewsQuery.data.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-brand-gold/10 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-brand-ink">
                        {review.user?.name || "Guest"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-brand-ink/60">
                        <StarRatingDisplay rating={review.rating} />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                    {review.comment ? (
                      <p className="mt-2 text-sm text-brand-ink/70">{review.comment}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-brand-ink/60">No reviews yet.</p>
            )}

            {reviewsQuery.data?.canReview ? (
              <div className="mt-4 border-t border-brand-gold/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/70">
                  Add a review
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <StarRatingInput value={reviewRating} onChange={setReviewRating} />
                  <span className="text-xs text-brand-ink/50">{reviewRating}/5</span>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={3}
                  placeholder="Share a quick note (optional)"
                  className="mt-3 w-full rounded-xl border border-brand-gold/10 bg-black/40 px-3 py-2 text-sm text-brand-ink"
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => reviewMutation.mutate()}
                    disabled={reviewRating === 0 || reviewMutation.isPending}
                    className="rounded-full bg-brand-gold px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:bg-brand-gold/40"
                  >
                    {reviewMutation.isPending ? "Submitting" : "Submit review"}
                  </button>
                  {reviewMessage ? (
                    <span className="text-xs text-emerald-700">{reviewMessage}</span>
                  ) : null}
                  {reviewError ? (
                    <span className="text-xs text-brand-cinnabar">{reviewError}</span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

        </div>
        <div className="sticky bottom-0 z-20 border-t border-brand-gold/10 bg-brand-obsidian/95 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 rounded-full border border-brand-gold/30 px-3 py-1 text-sm">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="text-brand-ink/70"
              >
                -
              </button>
              <span className="min-w-[28px] text-center font-semibold text-brand-ink">
                {quantity}
              </span>
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="text-brand-ink/70"
              >
                +
              </button>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold text-brand-ink">
                Total: {formatCurrency(total, item.currency)}
              </p>
              <button
                onClick={onConfirm}
                className="rounded-full bg-brand-gold px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:bg-brand-gold/40"
                disabled={!item.isAvailable}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getMenuObjectPosition(name: string) {
  const text = name.toLowerCase();
  const needsTopCrop = text.includes("soup") || text.includes("noodle") || text.includes("bowl");
  return needsTopCrop ? "object-top" : "object-center";
}

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}
