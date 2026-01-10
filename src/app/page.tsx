import { redirect } from "next/navigation";

// Root page redirects to public homepage
export default function Home() {
  // The public homepage is now at /(public)/page.tsx
  // When users visit /, they should see the public page
  redirect("/about");
}
