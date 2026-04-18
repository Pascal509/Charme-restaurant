"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MenuItem } from "@/features/menu/types";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/50 px-4 py-8 transition-opacity">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-brand-rice shadow-crisp">
        <div className="relative h-56 w-full bg-brand-ink/5 sm:h-72">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-brand-ink/50">
              No image
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-ink"
          >
            Close
          </button>
        </div>
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-ink/50">Details</p>
              <h3 className="mt-2 text-2xl font-semibold text-brand-ink">{item.name}</h3>
              {item.description ? (
                <p className="mt-2 text-sm text-brand-ink/70">{item.description}</p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-ink/60">From</p>
              <p className="text-lg font-semibold text-brand-ink">
                {formatCurrency(item.priceMinor, item.currency)}
              </p>
            </div>
          </div>

          {item.modifierGroups && item.modifierGroups.length > 0 ? (
            <div className="rounded-lg border border-brand-ink/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/60">
                Modifiers
              </p>
              <div className="mt-3 space-y-3">
                {item.modifierGroups.map((group) => (
                  <div key={group.id} className="rounded-md border border-brand-ink/10 px-3 py-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-brand-ink">
                      <span>{group.name}</span>
                      <span className="text-xs text-brand-ink/60">
                        {group.minSelect}-{group.maxSelect}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-brand-ink/60">
                      {group.options.map((option) => (
                        <span key={option.id} className="rounded-full bg-brand-ink/5 px-2 py-1">
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

          <div className="rounded-lg border border-brand-ink/10 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/60">
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
                <span className="rounded-full bg-brand-ink/5 px-3 py-1 text-xs text-brand-ink/70">
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
                  <div key={review.id} className="rounded-md border border-brand-ink/10 px-3 py-2">
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
              <div className="mt-4 border-t border-brand-ink/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/60">
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
                  className="mt-3 w-full rounded-md border border-brand-ink/10 px-3 py-2 text-sm text-brand-ink"
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => reviewMutation.mutate()}
                    disabled={reviewRating === 0 || reviewMutation.isPending}
                    className="rounded-md bg-brand-ink px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-ink/30"
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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 rounded-full border border-brand-ink/20 px-3 py-1 text-sm">
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
                className="rounded-md bg-brand-cinnabar px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-cinnabar/60"
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

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}
