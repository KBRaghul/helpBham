export const SITE = {
  name: "helpBham",
  tagline: "Cold-Night Outreach for Birmingham",
  description:
    "helpBham connects neighbors, volunteers and shelters in Birmingham, Alabama to get people sleeping rough into a warm bed on cold nights.",
  // Explicit setting wins; on Vercel fall back to the production domain it
  // provides at build time, so metadata never points at localhost.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
};
