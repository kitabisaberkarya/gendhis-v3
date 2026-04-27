
// Tipe untuk Cloudflare Pages Functions.
interface EventContext<Env = unknown> {
  request: Request;
  env: Env;
}
type PagesFunction<Env = unknown> = (context: EventContext<Env>) => Response | Promise<Response>;

/**
 * Handler untuk permintaan POST ke /api/auth.
 * Endpoint ini sudah usang dan telah dipindahkan ke /auth untuk performa yang lebih baik.
 * Mengembalikan status 410 (Gone) untuk menunjukkan bahwa sumber daya ini tidak lagi tersedia.
 */
export const onRequestPost: PagesFunction = () => {
    const errorResponse = {
        success: false,
        error: "Endpoint ini sudah usang (deprecated). Silakan gunakan endpoint /auth.",
    };
    return new Response(JSON.stringify(errorResponse), {
        status: 410, // 410 Gone
        headers: { 'Content-Type': 'application/json' },
    });
};
