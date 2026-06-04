import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center text-center">
      <div>
        <span className="text-xs uppercase tracking-[0.3em] text-accent">404</span>
        <h1 className="mt-3 font-display text-5xl">Page not found</h1>
        <p className="mt-3 text-ink/70">The page you're looking for has wandered off.</p>
        <Button asChild variant="primary" size="lg" className="mt-6">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
