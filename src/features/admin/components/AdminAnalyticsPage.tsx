"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Container from "@/components/layout/Container";
import { getDictionary, t } from "@/lib/i18n";

const ANALYTICS_ENDPOINT = "/api/admin/analytics?days=30";

type AnalyticsResponse = {
  rangeStart: string;
  rangeDays: number;
  currency: string;
  summary: {
    revenueMinor: number;
    orderCount: number;
    averageOrderValueMinor: number;
  };
  daily: Array<{
    date: string;
    revenueMinor: number;
    orderCount: number;
    averageOrderValueMinor: number;
  }>;
  topItems: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    revenueMinor: number;
  }>;
};

export default function AdminAnalyticsPage({ locale }: { locale: string }) {
  const dict = getDictionary(locale);
  const analyticsQuery = useQuery<AnalyticsResponse>({
    queryKey: ["admin-analytics", 30],
    queryFn: async () => {
      const response = await fetch(ANALYTICS_ENDPOINT, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || t(dict, "admin.analytics.error"));
      }
      return response.json();
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const data = analyticsQuery.data;
  const linePoints = useMemo(() => buildLinePoints(data?.daily ?? []), [data?.daily]);
  const barMax = useMemo(() => maxValue(data?.topItems ?? []), [data?.topItems]);

  return (
    <main className="bg-brand-rice">
      <Container className="py-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-ink/60">
            {t(dict, "admin.analytics.eyebrow")}
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">
                {t(dict, "admin.analytics.title")}
              </h1>
              <p className="mt-2 text-sm text-brand-ink/70">
                {t(dict, "admin.analytics.subtitle")}
              </p>
            </div>
            <span className="rounded-full border border-brand-ink/10 bg-white px-3 py-1 text-xs text-brand-ink/60">
              {t(dict, "admin.analytics.period")}
            </span>
          </div>
        </div>
      </Container>

      <section className="border-t border-brand-ink/10">
        <Container className="py-8">
          {analyticsQuery.isLoading ? (
            <div className="rounded-lg border border-brand-ink/10 bg-white p-6 text-sm text-brand-ink/70">
              {t(dict, "admin.analytics.loading")}
            </div>
          ) : analyticsQuery.isError ? (
            <div className="rounded-lg border border-brand-cinnabar/30 bg-white p-6 text-sm text-brand-cinnabar">
              {t(dict, "admin.analytics.error")}
            </div>
          ) : data ? (
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <div className="rounded-lg border border-brand-ink/10 bg-white p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-brand-ink">
                      {t(dict, "admin.analytics.dailyRevenue")}
                    </h2>
                    <span className="text-xs text-brand-ink/60">
                      {formatCurrency(data.summary.revenueMinor, data.currency)}
                    </span>
                  </div>
                  <div className="mt-4 rounded-md border border-brand-ink/10 bg-brand-rice px-4 py-6">
                    {linePoints.length === 0 ? (
                      <p className="text-sm text-brand-ink/60">
                        {t(dict, "admin.analytics.noRevenueData")}
                      </p>
                    ) : (
                      <LineChart points={linePoints} />
                    )}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MetricCard
                      label={t(dict, "admin.analytics.orderCount")}
                      value={String(data.summary.orderCount)}
                    />
                    <MetricCard
                      label={t(dict, "admin.analytics.averageOrder")}
                      value={formatCurrency(data.summary.averageOrderValueMinor, data.currency)}
                    />
                    <MetricCard label={t(dict, "admin.analytics.revenue")} value={formatCurrency(data.summary.revenueMinor, data.currency)} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border border-brand-ink/10 bg-white p-5 shadow-soft">
                  <h2 className="text-lg font-semibold text-brand-ink">
                    {t(dict, "admin.analytics.topSellingItems")}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {data.topItems.length === 0 ? (
                      <p className="text-sm text-brand-ink/60">{t(dict, "admin.analytics.noSalesYet")}</p>
                    ) : (
                      data.topItems.map((item) => (
                        <div key={item.menuItemId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-brand-ink/70">
                            <span className="font-semibold text-brand-ink">{item.name}</span>
                            <span>
                              {item.quantity} {t(dict, "admin.analytics.soldSuffix")}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-brand-ink/10">
                            <div
                              className="h-2 rounded-full bg-brand-ink"
                              style={{
                                width: `${barMax ? Math.max((item.quantity / barMax) * 100, 6) : 0}%`
                              }}
                            />
                          </div>
                          <p className="text-xs text-brand-ink/50">
                            {formatCurrency(item.revenueMinor, data.currency)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-brand-ink/10 bg-white p-5 shadow-soft">
                  <h2 className="text-lg font-semibold text-brand-ink">
                    {t(dict, "admin.analytics.orderVolume")}
                  </h2>
                  <div className="mt-4 rounded-md border border-brand-ink/10 bg-brand-rice px-4 py-6">
                    {data.daily.length === 0 ? (
                      <p className="text-sm text-brand-ink/60">
                        {t(dict, "admin.analytics.noOrderData")}
                      </p>
                    ) : (
                      <OrderCountChart data={data.daily} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Container>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-brand-ink/10 bg-brand-rice px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">{label}</p>
      <p className="mt-2 text-xl font-semibold text-brand-ink">{value}</p>
    </div>
  );
}

function LineChart({ points }: { points: Array<{ x: number; y: number }> }) {
  const path = buildLinePath(points);
  return (
    <svg viewBox="0 0 320 160" className="h-40 w-full">
      <path d="M0 140 H320" stroke="rgba(15, 23, 42, 0.2)" strokeWidth="1" fill="none" />
      <path d={path} stroke="#1f2937" strokeWidth="2" fill="none" />
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r="3" fill="#1f2937" />
      ))}
    </svg>
  );
}

function OrderCountChart({
  data
}: {
  data: Array<{ date: string; orderCount: number }>;
}) {
  const max = Math.max(...data.map((item) => item.orderCount), 1);
  return (
    <div className="space-y-3">
      {data.slice(-6).map((item) => (
        <div key={item.date} className="flex items-center gap-3">
          <span className="w-16 text-xs text-brand-ink/50">{formatDay(item.date)}</span>
          <div className="h-2 flex-1 rounded-full bg-brand-ink/10">
            <div
              className="h-2 rounded-full bg-brand-jade"
              style={{ width: `${(item.orderCount / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-xs text-brand-ink/70">{item.orderCount}</span>
        </div>
      ))}
    </div>
  );
}

function buildLinePoints(daily: Array<{ revenueMinor: number }>) {
  if (daily.length === 0) return [];
  const max = Math.max(...daily.map((item) => item.revenueMinor), 1);
  const width = 300;
  const height = 120;

  return daily.map((item, index) => ({
    x: (index / Math.max(daily.length - 1, 1)) * width + 10,
    y: height - (item.revenueMinor / max) * height + 20
  }));
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  return points.reduce(
    (acc, point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`,
    ""
  );
}

function maxValue(items: Array<{ quantity: number }>) {
  return Math.max(...items.map((item) => item.quantity), 1);
}

function formatCurrency(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency
  });
  return formatter.format(amountMinor / 100);
}

function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}
