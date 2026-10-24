import { redirect } from "next/navigation";

/**
 * The old name-only creation screen was replaced by the idea-entry page.
 * Keep the URL as a redirect so bookmarks and links do not 404.
 */
export default function CreateProjectRedirect() {
  redirect("/");
}
