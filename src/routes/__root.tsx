import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppShell } from "@/components/app-shell";
import { NotFound } from "@/components/not-found";
import { APP_NAME, TAGLINE } from "@/lib/memoir/copy";
import { RISO_BODY_FONTS, RISO_INK_PAIRS, RISO_TITLE_FONTS } from "@/lib/memoir/looks";
import appCss from "../styles.css?url";

/** Prefix public assets with Vite base (Pages project path). */
function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const cleaned = path.replace(/^\//, "");
  return `${base}${cleaned}`;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: TAGLINE },
      { name: "theme-color", content: "#fff3df" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: assetUrl("favicon.svg") },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: assetUrl("manifest.webmanifest") },
      { rel: "apple-touch-icon", href: assetUrl("icons/apple-touch-icon.png") },
    ],
  }),
  notFoundComponent: NotFound,
  component: RootDocument,
});

/**
 * Runs before first paint: apply saved mode / look / riso inks to <html> so the
 * page never flashes the default skin. Mirrors applyThemeToDocument().
 */
const THEME_BOOT = `(function(){try{
var d=document.documentElement;
var s=(JSON.parse(localStorage.getItem("pocketmemoir.v1")||"{}").state)||{};
var m=s.mode||s.jacket;m=(m==="corkboard"||m==="ash")?"corkboard":"scrapbook";
var l=["storybook","comic","riso"].indexOf(s.look)>=0?s.look:"storybook";
d.dataset.mode=m;d.dataset.look=l;d.dataset.jacket=m;
if(l==="riso"){
var r=s.riso||{};var P=${JSON.stringify(RISO_INK_PAIRS)};var T=${JSON.stringify(RISO_TITLE_FONTS)};var B=${JSON.stringify(RISO_BODY_FONTS)};
var hx=/^#[0-9a-f]{6}$/i;var p=null;for(var i=0;i<P.length;i++){if(P[i].id===r.pair)p=P[i];}
var a=r.pair==="custom"&&hx.test(r.inkA)?r.inkA:(p||P[0]).a;var b=r.pair==="custom"&&hx.test(r.inkB)?r.inkB:(p||P[0]).b;
var t=T[0],f=B[0];for(i=0;i<T.length;i++){if(T[i].id===r.titleFont)t=T[i];}for(i=0;i<B.length;i++){if(B[i].id===r.bodyFont)f=B[i];}
d.style.setProperty("--riso-a",a);d.style.setProperty("--riso-b",b);d.style.setProperty("--riso-title",t.stack);d.style.setProperty("--riso-body",f.stack);
}}catch(e){}})();`;

function RootDocument() {
  return (
    <html lang="en" data-mode="scrapbook" data-look="storybook" data-jacket="scrapbook" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <AppShell>
            <Outlet />
          </AppShell>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
