import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <section className="flex flex-col items-center py-10 text-center">
      <h1 className="font-display text-3xl">This page isn’t stuck in.</h1>
      <p className="mt-2 max-w-sm text-muted">It wandered off, or it was never kept.</p>
      <Link to="/" className="sticker-cta mt-6">
        Back to the shelf
      </Link>
    </section>
  );
}
