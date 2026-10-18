import Link from 'next/link';

export default function NotFound() {
  return <main className="error-page"><h1>That page is not here.</h1><p>Explore the product range or return to the home page.</p><Link className="btn btn-blue" href="/">Return home</Link></main>;
}
