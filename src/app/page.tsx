import PublicHomePage, { metadata } from "./(public)/page";
import PublicLayout from "./(public)/layout";

export { metadata };

// Root front page now uses the public SWI company profile with the same public shell
// as /about, /portfolio, /products, and /upcoming-events.
export default function Home() {
  return (
    <PublicLayout>
      <PublicHomePage />
    </PublicLayout>
  );
}
