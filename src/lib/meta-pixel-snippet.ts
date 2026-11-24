import { META_EXCLUDED_PATH, metaPixel } from "@/config/meta";

/**
 * Meta's official Pixel base code, wrapped so it:
 * - skips private/staff paths (see META_EXCLUDED_PATH),
 * - turns off Meta's automatic history-change PageViews (we send our own on
 *   Next.js route changes, so each page counts once) and automatic button
 *   "events" (which would scrape page content),
 * - can be started later via window.__naturoPixelInit() if the visitor first
 *   lands on an excluded page and then moves to a normal one.
 */
export function pixelBaseCode(opts: { pageView: boolean; respectExcludedPaths: boolean } = { pageView: true, respectExcludedPaths: true }) {
  const id = JSON.stringify(metaPixel.id);
  const excluded = META_EXCLUDED_PATH.source;
  return `(function(){
window.__naturoPixelInit=function(){
if(window.__naturoPixelStarted)return;window.__naturoPixelStarted=true;
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq.disablePushState=true;
fbq('set','autoConfig',false,${id});
fbq('init',${id});
${opts.pageView ? "fbq('track','PageView');window.__naturoPixelLastPage=location.pathname+location.search;" : ""}
};
${opts.respectExcludedPaths ? `if(!new RegExp(${JSON.stringify(excluded)}).test(location.pathname))window.__naturoPixelInit();` : "window.__naturoPixelInit();"}
})();`;
}
