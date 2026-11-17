import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="card p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="muted mb-6">That page doesn't exist.</p>
        <Link to="/" className="btn-primary">Back home</Link>
      </div>
    </main>
  );
}
