import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth-helpers";
import { becomeContributor } from "./actions";

export const metadata: Metadata = { title: "Write for Coco" };
export const dynamic = "force-dynamic";

const RANK: Record<string, number> = { READER: 0, WRITER: 1, EDITOR: 2, ADMIN: 3 };

export default async function ContributePage() {
  const user = await getSessionUser();
  const isStaff = user ? RANK[user.role ?? "READER"] >= RANK.WRITER : false;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl font-extrabold">Write for Coco</h1>
      <p className="mt-3 text-muted">
        Coco is open to contributors. You get a newsroom account to draft and edit
        your own stories. An editor reviews each piece and publishes it — nothing
        goes live without that check.
      </p>

      <ul className="mt-5 space-y-2 text-sm text-muted">
        <li>• Draft in a rich editor, add a cover image, tag a section.</li>
        <li>• Submit for review when it&apos;s ready.</li>
        <li>• Your name runs on the byline once it&apos;s published.</li>
      </ul>

      <div className="mt-8">
        {!user && (
          <div className="rounded-lg border border-line p-4 text-sm">
            <p>
              <Link href="/register" className="font-medium text-accent hover:underline">
                Create an account
              </Link>{" "}
              (tick “I want to write for Coco”), or{" "}
              <Link href="/login?from=/contribute" className="text-accent hover:underline">
                sign in
              </Link>{" "}
              if you already read here.
            </p>
          </div>
        )}

        {user && isStaff && (
          <p className="text-sm">
            You already have a newsroom account.{" "}
            <Link href="/studio" className="font-medium text-accent hover:underline">
              Open the newsroom →
            </Link>
          </p>
        )}

        {user && !isStaff && (
          <form action={becomeContributor}>
            <button
              type="submit"
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Become a contributor
            </button>
            <p className="mt-2 text-xs text-muted">
              Upgrades this account and takes you to the newsroom.
            </p>
          </form>
        )}
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="text-accent hover:underline">← Back to Coco</Link>
      </p>
    </div>
  );
}
