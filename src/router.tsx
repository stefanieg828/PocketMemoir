import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

/** Vite `base` (e.g. `/pocketmemoir-preview/` on Pages); strip trailing slash for the router. */
function routerBasepath(): string | undefined {
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/") return undefined;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export function getRouter() {
  return createRouter({
    routeTree,
    basepath: routerBasepath(),
    defaultErrorComponent: AppErrorComponent,
  });
}
