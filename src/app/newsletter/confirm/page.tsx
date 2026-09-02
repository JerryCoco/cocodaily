import Link from "next/link";
import type { Metadata } from "next";
import { confirmByToken } from "../actions";

export const metadata: Metadata = { title: "Confirm subscription" };
export const dynamic = "force-dynamic";

export default async function ConfirmPage({ searchParams }: PageProps<"/newsletter/confirm">) {
  const { token } = await searchParams;
  const result = typeof token === "string" ? await confirmByToken(token) : { ok: false as const };

  return (
    <div className="mx-auto mt-20 max-w-md px-4 text-center">
      {result.ok ? (
        <>
          <h1 className="font-display text-2xl font-extrabold">You&apos;re subscribed</h1>
          <p className="mt-2 text-muted">
            {"email" in result ? result.email : "That address"} will get The Coco briefing every
            morning.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-extrabold">Link not valid</h1>
          <p className="mt-2 text-muted">
            This confirmation link is expired or already used. Try subscribing again.
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
