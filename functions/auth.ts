
// Tipe untuk Cloudflare Pages Functions.
interface EventContext<Env = unknown> {
  request: Request;
  env: Env;
}
type PagesFunction<Env = unknown> = (context: EventContext<Env>) => Response | Promise<Response>;

// Harapkan variabel lingkungan ADMIN_PASSWORD dari Cloudflare.
interface Env {
  ADMIN_PASSWORD?: string;
}

// Harapkan body permintaan berisi password.
interface RequestBody {
    password?: string;
}

/**
 * Handler untuk permintaan POST ke /auth.
 * Fungsi ini memverifikasi kata sandi admin dengan cepat.
 * Karena berada di path root, ia di-deploy secara terpisah dari fungsi berat di /api.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const requestBody: RequestBody = await context.request.json();
    const { password } = requestBody;

    const adminPassword = context.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "Password admin tidak dikonfigurasi di server." }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password === adminPassword) {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Password salah" }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error("Error dalam fungsi otentikasi:", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error", details: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
