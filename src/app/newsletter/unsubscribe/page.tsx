import Link from "next/link";
import type { Metadata } from "next";
import { unsubscribeByToken } from "../actions";

export const metadata: Metadata = { title: "Unsubscribe" };
export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ searchParams }: PageProps<"/newsletter/unsubscribe">) {
  const { token } = await searchParams;
  const result = typeof token === "string" ? await unsubscribeByToken(token) : { ok: false };

  return (
    <div className="mx-auto mt-20 max-w-md px-4 text-center">
      {result.ok ? (
        <>
          <h1 className="font-display text-2xl font-extrabold">You&apos;re unsubscribed</h1>
          <p className="mt-2 text-muted">
            {"email" in result ? result.email : "That address"} won&apos;t get the newsletter anymore.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-extrabold">Link not valid</h1>
          <p className="mt-2 text-muted">
            This unsubscribe link is expired or already used.
          </p>
        </>
      )}
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Back to Coco
      </Link>
    </div>
  );
}
