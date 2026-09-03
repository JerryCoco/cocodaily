import Link from "next/link";
import { requireStaff, canPublish } from "@/lib/auth-helpers";
import {
  getAnalyticsOverview,
  getViewsSeries,
  getSubscriberSeries,
  getTopArticles,
  getCommentBreakdown,
  getTopSaved,
} from "@/lib/analytics";
import { AreaChart, BarList } from "@/components/studio/mini-charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="kicker text-muted">{label}</div>
      <div className="font-display mt-1.5 text-3xl font-extrabold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 md:p-5">
      <h2 className="kicker mb-3 text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default async function AnalyticsPage() {
  const user = await requireStaff();
  if (!canPublish(user.role)) {
    return <p className="text-muted">Analytics are available to editors.</p>;
  }

  const [ov, views, subs, top, commentBreak, topSaved] = await Promise.all([
    getAnalyticsOverview(),
    getViewsSeries(30),
    getSubscriberSeries(30),
    getTopArticles(10),
    getCommentBreakdown(),
    getTopSaved(5),
  ]);

  const views30 = views.reduce((n, d) => n + d.value, 0);
  const subs30 = subs.reduce((n, d) => n + d.value, 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">Analytics</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total views" value={ov.totalViews.toLocaleString()} />
        <Stat label="Views (30d)" value={views30.toLocaleString()} />
        <Stat label="Published" value={ov.published} />
        <Stat label="Subscribers" value={ov.subscribers} hint={`+${subs30} in 30d`} />
        <Stat label="Avg views / article" value={ov.avgViews.toLocaleString()} />
        <Stat
          label="Subs / 1k views"
          value={ov.subsPerThousandViews}
          hint="newsletter conversion proxy"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Views · last 30 days">
          <AreaChart data={views} label="Article views per day, last 30 days" />
        </Card>
        <Card title="New subscribers · 30 days">
          <AreaChart data={subs} label="New newsletter subscribers per day" />
        </Card>

        <Card title="Top articles by views">
          <BarList
            items={top.map((a) => ({
              label: a.title,
              value: a.viewCount,
              color: a.section.color,
            }))}
          />
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Comments">
            <BarList
              items={commentBreak.map((c) => ({
                label: c.status.toLowerCase(),
                value: c.count,
              }))}
            />
            {ov.pendingComments > 0 && (
              <p className="mt-3 text-sm">
                <Link href="/studio/comments?status=PENDING" className="text-accent hover:underline">
                  {ov.pendingComments} pending · review →
                </Link>
              </p>
            )}
          </Card>

          <Card title="Most saved">
            <BarList items={topSaved.map((s) => ({ label: s.title, value: s.saves }))} />
          </Card>
        </div>
      </div>
    </div>
  );
}
