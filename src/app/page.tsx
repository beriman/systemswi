import PublicHomePage, { metadata } from "./(public)/page";

export { metadata };

// Root front page now uses the public SWI company profile.
// Operational dashboard remains directly accessible at /dashboard during development.
export default function Home() {
  return <PublicHomePage />;
}
