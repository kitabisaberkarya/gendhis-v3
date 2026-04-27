// supabase/functions/generate-document/index.ts
// Supabase Edge Function ini sudah tidak aktif digunakan.
// Fungsi generate dokumen ditangani oleh Vercel Edge Function di /api/generate.ts
// yang menggunakan Claude AI (Anthropic).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (_req) => {
  return new Response(
    JSON.stringify({ error: "Endpoint ini sudah tidak aktif. Gunakan /api/generate." }),
    {
      status: 410,
      headers: { "Content-Type": "application/json" },
    }
  );
});
