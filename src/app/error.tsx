'use client';
import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-page" role="main">
    <p className="eyebrow">Page unavailable</p>
    <h1>We could not load this page.</h1>
    <p>Please try again. You can also return to the home page and continue browsing.</p>
    <div className="error-actions">
      <button className="btn btn-blue" type="button" onClick={reset}>Try again</button>
      <Link className="btn btn-ice" href="/">Return home</Link>
    </div>
  </main>;
}
