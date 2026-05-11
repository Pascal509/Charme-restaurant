"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MenuItem } from "@/features/menu/types";
import ImageWrapper from "@/components/ui/ImageWrapper";
import { getDictionary, t } from "@/lib/i18n";
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
  onConfirm,
  locale
}: {
  item: MenuItem;
  quantity: number;
  onQuantityChange: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  locale?: string;
}) {
  const queryClient = useQueryClient();
  const dict = getDictionary(locale);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
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
        throw new Error(t(dict, "itemDetail.loadReviewsError"));
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
        throw new Error(payload.error || t(dict, "itemDetail.reviewError"));
      }

      return payload as { review: Review };
    },
    onSuccess: () => {
      setReviewMessage(t(dict, "itemDetail.reviewSuccess"));
      setReviewError(null);
      setReviewRating(0);
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", item.id] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (error) => {
      setReviewError(error instanceof Error ? error.message : t(dict, "itemDetail.reviewError"));
      setReviewMessage(null);
    }
  });

  useEffect(() => {
    lastFocusedElementRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      lastFocusedElementRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm transition-opacity animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-detail-title"
        aria-describedby="item-detail-description"
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-brand-gold/10 bg-brand-obsidian shadow-crisp animate-soft-scale focus-visible:outline-none"
      >
        <ImageWrapper
          src={item.imageUrl}
          alt={item.name}
          aspect="menu"
          sizes="(max-width: 768px) 100vw, 60vw"
          blurDataURL={blurData}
          className="w-full mb-6"
          objectPositionClassName={getMenuObjectPosition(item.name)}
          fallbackLabel={t(dict, "checkout.noImage")}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-brand-gold/30 bg-black/70 px-4 py-2 text-xs font-semibold text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60"
          >
            {t(dict, "common.close")}
          </button>
          <div className="absolute bottom-6 left-6">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-gold/80">{t(dict, "common.viewMore")}</p>
            <h2 id="item-detail-title" className="mt-2 font-display text-3xl text-brand-ink sm:text-4xl">
              {item.name}
            </h2>
          </div>
        </ImageWrapper>
        <div id="item-detail-description" className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {item.description ? (
                <p className="mt-2 text-sm text-brand-ink/70 sm:text-base">
                  {item.description}
                </p>
              ) : null}
            </div>
            <div className="text-right">
                <p className="text-xs text-brand-gold/70">{t(dict, "itemDetail.from")}</p>
              <p className="text-lg font-semibold text-brand-gold">
                {formatCurrency(item.priceMinor, item.currency)}
              </p>
            </div>
          </div>

          {item.modifierGroups && item.modifierGroups.length > 0 ? (
            <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold/70">
                {t(dict, "itemDetail.modifiers")}
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
                {t(dict, "itemDetail.selectOptions")}
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-brand-gold/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/70">
                  {t(dict, "itemDetail.reviews")}
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
                  {t(dict, "itemDetail.reviewSubmitted")}
                </span>
              ) : null}
            </div>

            {reviewsQuery.isLoading ? (
              <p className="mt-3 text-xs text-brand-ink/60" role="status" aria-live="polite">{t(dict, "itemDetail.loadingReviews")}</p>
            ) : reviewsQuery.isError ? (
              <p className="mt-3 text-xs text-brand-cinnabar" role="alert">{t(dict, "itemDetail.loadReviewsError")}</p>
            ) : reviewsQuery.data?.reviews.length ? (
              <div className="mt-4 space-y-3">
                {reviewsQuery.data.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-brand-gold/10 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-brand-ink">
                        {review.user?.name || t(dict, "common.guest")}
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
              <p className="mt-3 text-xs text-brand-ink/60">{t(dict, "itemDetail.noReviews")}</p>
            )}

            {reviewsQuery.data?.canReview ? (
              <div className="mt-4 border-t border-brand-gold/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/70">
                  {t(dict, "itemDetail.addReview")}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <StarRatingInput value={reviewRating} onChange={setReviewRating} />
                  <span className="text-xs text-brand-ink/50">{reviewRating}/5</span>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={3}
                  placeholder={t(dict, "itemDetail.shareNote")}
                  className="mt-3 w-full rounded-xl border border-brand-gold/10 bg-black/40 px-3 py-2 text-sm text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60"
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => reviewMutation.mutate()}
                    disabled={reviewRating === 0 || reviewMutation.isPending}
                    className="rounded-full bg-brand-gold px-4 py-2 text-xs font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 disabled:cursor-not-allowed disabled:bg-brand-gold/40"
                  >
                    {reviewMutation.isPending ? t(dict, "itemDetail.submitting") : t(dict, "itemDetail.submitReview")}
                  </button>
                  {reviewMessage ? (
                    <span className="text-xs text-emerald-700" role="status" aria-live="polite">{reviewMessage}</span>
                  ) : null}
                  {reviewError ? (
                    <span className="text-xs text-brand-cinnabar" role="alert">{reviewError}</span>
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
                type="button"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="text-brand-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60"
              >
                -
              </button>
              <span className="min-w-[28px] text-center font-semibold text-brand-ink">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(quantity + 1)}
                className="text-brand-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60"
              >
                +
              </button>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold text-brand-ink">
                {t(dict, "itemDetail.total")}: {formatCurrency(total, item.currency)}
              </p>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-full bg-brand-gold px-5 py-2 text-sm font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 disabled:cursor-not-allowed disabled:bg-brand-gold/40"
                disabled={!item.isAvailable}
              >
                {t(dict, "itemDetail.addToCart")}
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
