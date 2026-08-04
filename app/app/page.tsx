import AppHome from "@/components/AppHome";

/**
 * The workspace entry — what the desktop shell opens.
 *
 * This is a separate route rather than a branch inside `/` because `/` is
 * statically prerendered at build time: an env-var check there is evaluated
 * during the build, not per request, so the desktop app would be served
 * whatever the build machine happened to produce. Two routes, two builds,
 * no ambiguity.
 */
export default function AppEntry() {
  return <AppHome />;
}
