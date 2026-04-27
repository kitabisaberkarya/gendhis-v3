export {};

declare global {
  interface Window {
    process: {
      env: {
        GOOGLE_SHEET_APP_SCRIPT_URL: string;
        // FIX: Add Supabase environment variables to the global type definition.
        SUPABASE_URL: string;
        SUPABASE_ANON_KEY: string;
      };
    };
  }
}