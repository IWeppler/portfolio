import Script from "next/script";

/**
 * Google Analytics cargado con `lazyOnload`: gtag (~175 KB con GTM) baja
 * cuando la pagina ya cargo y el navegador esta libre, en vez de competir con
 * la hidratacion como hace `@next/third-parties` (afterInteractive). Las
 * visitas se registran igual; cambia solo cuando se carga el script.
 */
export function GoogleAnalyticsLazy({ gaId }: { gaId?: string }) {
  if (!gaId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
      <Script id="ga-init" strategy="lazyOnload">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  );
}
