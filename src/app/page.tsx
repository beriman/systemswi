import { redirect } from "next/navigation";

// Root page redirects to the operating dashboard while System SWI is in development.
// Set NEXT_PUBLIC_SHOW_PUBLIC_SITE=true to expose the company profile at root again.
export default function Home() {
  if (process.env.NEXT_PUBLIC_SHOW_PUBLIC_SITE === "true") {
    redirect("/about");
  }

  redirect("/dashboard");
}
