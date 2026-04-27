
// Layanan untuk berinteraksi dengan Supabase sebagai backend.
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { TestimonialData, UsageLogData, GeneratedDocumentData, UserProfile } from '../types';

// Ambil createClient dari objek global yang disediakan oleh script CDN di index.html.
const { createClient } = (window as any).supabase;

let supabase: SupabaseClient | null = null;
let initializationError: string | null = null;

try {
    const SUPABASE_URL = window.process?.env?.SUPABASE_URL;
    const SUPABASE_ANON_KEY = window.process?.env?.SUPABASE_ANON_KEY;
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    if (error instanceof Error) {
        if (error.message.includes("supabaseUrl")) {
             initializationError = "Konfigurasi Supabase belum lengkap. Pastikan SUPABASE_URL telah diatur.";
        } else if (error.message.includes("supabaseKey")) {
             initializationError = "Konfigurasi Supabase belum lengkap. Pastikan SUPABASE_ANON_KEY telah diatur.";
        } else {
            initializationError = error.message;
        }
    } else {
        initializationError = "Terjadi kesalahan saat menginisialisasi Supabase.";
    }
}

const checkSupabaseClient = () => {
    if (initializationError) throw new Error(initializationError);
    if (!supabase) throw new Error("Klien Supabase tidak tersedia.");
    return supabase;
};

export const getSession = async (): Promise<{ session: Session | null }> => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return data;
    } catch (e) {
        // Fail-safe: Jika Supabase mati, kembalikan sesi null agar app tidak crash
        console.warn("Supabase auth check failed (Offline/Paused mode):", e);
        return { session: null };
    }
};

export const onAuthStateChange = (callback: (session: Session | null) => void) => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
            callback(session);
        });
        return subscription;
    } catch (e) {
        console.warn("Supabase auth listener failed:", e);
        return { unsubscribe: () => {} };
    }
};

export const signOut = async () => {
    const supabaseClient = checkSupabaseClient();
    await supabaseClient.auth.signOut();
};

export const getSupabaseClient = () => checkSupabaseClient();

export const getTestimonials = async (): Promise<TestimonialData[]> => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { data, error } = await supabaseClient
            .from('testimonials')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(25);
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.warn("Gagal memuat testimoni (Database mungkin Paused):", error);
        return []; // Kembalikan array kosong agar UI tidak error
    }
};

export const getFeatureToggles = async (): Promise<Record<string, boolean>> => {
    try {
        const supabaseClient = checkSupabaseClient();
        // Set timeout pendek (3 detik) agar aplikasi tidak lama loading jika DB mati
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
        
        const fetchPromise = supabaseClient
            .from('feature_flags')
            .select('feature_name, is_enabled');

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (error) throw error;
        
        return (data || []).reduce((acc: any, flag: any) => {
            acc[flag.feature_name] = flag.is_enabled;
            return acc;
        }, {} as Record<string, boolean>);
    } catch (error) {
        console.warn("Gagal memuat Feature Flags. Menggunakan mode default (Semua Aktif).", error);
        // Fallback: Aktifkan semua fitur penting secara default jika DB mati
        return {
            'rpm_generator': true,
            'question_card_generator': true,
            'rps_generator': true,
            'rpd_generator': true,
            'atp_generator': true,
            'journal_generator': true,
            'ck_generator': true,
            'client_api_key_input': true
        };
    }
};

export const getSettings = async (): Promise<Record<string, string>> => {
    try {
        const supabaseClient = checkSupabaseClient();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));

        const fetchPromise = supabaseClient
            .from('settings')
            .select('key, value');

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (error) throw error;
        return (data || []).reduce((acc: any, setting: any) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as Record<string, string>);
    } catch (error) {
        console.warn("Gagal memuat Settings. Menggunakan default.", error);
        return {
            'document_price': '10000'
        };
    }
};

export const getAnalyticsSummary = async () => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { data, error } = await supabaseClient.rpc('get_analytics_summary');

        if (error) {
            // Tangkap pesan khusus "Failed to fetch" yang dibungkus dalam objek error SDK
            if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
                 throw new Error("Database Supabase sedang 'Tertidur' (Paused). Fitur Generate tetap bisa digunakan.");
            }
            throw error;
        }
        return data;
    } catch (err) {
        // Tangkap TypeError mentah jika SDK gagal melakukan fetch
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('failed to fetch')) {
            throw new Error("Database Supabase sedang 'Tertidur' (Paused). Data analitik tidak tersedia, namun fitur Generate tetap berjalan normal.");
        }
        throw err;
    }
};

export const logUsage = async (usageData: { type: string; school_name: string; teacher_name: string; subject: string; }) => {
    // Fire and forget, jangan biarkan log usage yang gagal menghentikan aplikasi
    if (initializationError || !supabase) return { success: true };
    try {
        const { error } = await supabase.from('usage_logs').insert([usageData]);
        return { success: !error, error };
    } catch (e) {
        console.warn("Gagal mencatat log usage (Non-fatal):", e);
        return { success: false };
    }
};

export const submitTestimonial = async (testimonialData: { name: string; school: string; message: string; }) => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { error } = await supabaseClient.from('testimonials').insert([testimonialData]);
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
};

export const updateFeatureToggle = async (featureName: string, isEnabled: boolean) => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return { success: false, error: new Error("Otentikasi dibutuhkan.") };
        
        const { error } = await supabaseClient.from('feature_flags').update({ is_enabled: isEnabled }).eq('feature_name', featureName);
        return { success: !error, error: error as Error };
    } catch (e) {
        return { success: false, error: e as Error };
    }
};

export const updateSetting = async (settingKey: string, settingValue: string) => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return { success: false, error: new Error("Otentikasi dibutuhkan.") };
        const { error } = await supabaseClient.from('settings').update({ value: settingValue }).eq('key', settingKey);
        return { success: !error, error: error as Error };
    } catch (e) {
        return { success: false, error: e as Error };
    }
};

export const saveGeneratedDocument = async (docData: { userName: string; featureType: string; htmlContent: string; }): Promise<GeneratedDocumentData> => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { data, error } = await supabaseClient.from('generated_documents').insert({
                user_name: docData.userName,
                feature_type: docData.featureType,
                document_content_html: docData.htmlContent,
                payment_status: 'pending',
            }).select().single();
        if (error) throw error;
        return data;
    } catch (e) {
        // Jika gagal simpan ke DB, lempar error agar UI tahu (karena ini fitur berbayar, DB wajib hidup)
        throw new Error("Gagal menyimpan dokumen ke Database. Pastikan proyek Supabase aktif.");
    }
};

export const getDocumentById = async (documentId: string): Promise<GeneratedDocumentData | null> => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { data, error } = await supabaseClient.from('generated_documents').select('*').eq('id', documentId).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (e) {
        console.error("Gagal mengambil dokumen:", e);
        throw e;
    }
};

export const getUserProfile = async (): Promise<any | null> => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return null;
        const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (e) {
        console.warn("Gagal mengambil profil user:", e);
        return null;
    }
};

export const useCreditForDocument = async (documentId: string) => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { error } = await supabaseClient.rpc('process_credit_usage', { p_document_id: documentId });
        return { success: !error, error: error ? new Error(error.message) : undefined };
    } catch (e) {
        return { success: false, error: e as Error };
    }
};

export const createCreditPaymentLink = async (paymentData: { creditAmount: number; priceIdr: number; packageName: string; }) => {
    const supabaseClient = checkSupabaseClient();
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return { error: "Otentikasi dibutuhkan." };
    try {
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify(paymentData),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        return { payment_url: result.payment_url };
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
};

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { data, error } = await supabaseClient.rpc('get_all_user_profiles');
        if (error) throw new Error(error.message);
        return data || [];
    } catch (e) {
        return [];
    }
};

export const adminAddCredits = async (userId: string, amount: number) => {
    try {
        const supabaseClient = checkSupabaseClient();
        const { error } = await supabaseClient.rpc('admin_add_credits', { p_user_id: userId, p_amount_to_add: amount });
        return { success: !error, error: error ? new Error(error.message) : undefined };
    } catch (e) {
        return { success: false, error: e as Error };
    }
};
