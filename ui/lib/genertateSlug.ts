const RESERVED_SLUGS = [
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
  "traefik",
  "mail",
  "dockhand",
];
const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]{1,28})[a-z0-9]$/;

export function validateSlug(project_slug: string) {
  if (!SLUG_REGEX.test(project_slug))
    return "3-30 chars, lowercase letters, numbers, hyphens only";
  if (RESERVED_SLUGS.includes(project_slug)) return "This name is reserved";
  return null;
}

export function generateSlug(project_name: string) {
  return project_name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}
