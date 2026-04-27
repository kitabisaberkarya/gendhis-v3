// functions/_middleware.ts

interface EventContext {
  request: Request;
  next: () => Promise<Response>;
}

export const onRequest: (context: EventContext) => Promise<Response> = async (context) => {
  const url = new URL(context.request.url);
  const { hostname, pathname, search } = url;

  // Domain resmi yang baru
  const newDomain = "www.gendhis.app";
  
  // Daftar domain lama atau non-kanonikal yang akan dialihkan
  const domainsToRedirect = [
    "gendhis.pages.dev",
    "gendhis.vercel.app",
    "gendhis.app", // Juga alihkan versi non-www ke www untuk konsistensi
  ];

  // Periksa apakah hostname saat ini ada di dalam daftar yang akan dialihkan
  if (domainsToRedirect.includes(hostname)) {
    // Bangun URL baru, dengan mempertahankan path dan parameter query
    const newUrl = `https://${newDomain}${pathname}${search}`;

    // Kembalikan respons pengalihan permanen (301)
    return Response.redirect(newUrl, 301);
  }

  // Jika hostname sudah benar, atau ini adalah URL pratinjau Cloudflare, lanjutkan seperti biasa.
  return context.next();
};
