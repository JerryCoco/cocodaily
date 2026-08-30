import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto mt-24 max-w-md px-4 text-center">
      <p className="text-4xl font-extrabold">404</p>
      <p className="mt-2 text-muted">That page isn&apos;t here.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Back to the homepage
      </Link>
    </div>
  );
}
