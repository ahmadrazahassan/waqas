import type { Route } from "next";

/**
 * typedRoutes checks every href it can see as a literal, which is what we want
 * across the marketing site. It cannot check a string that only exists at
 * runtime: a notification target read from the database, a `next` parameter, or
 * an href inside a shared nav array whose literal type has been widened.
 *
 * This is the sanctioned escape hatch for exactly those cases. Do not reach for
 * it to silence an href you could have written as a literal, because that turns
 * route checking off for the one link most likely to be wrong.
 */
export function route(href: string): Route {
  return href as Route;
}
