// Layanan untuk berinteraksi dengan Google Sheets sebagai backend.

const SCRIPT_URL = window.process?.env?.GOOGLE_SHEET_APP_SCRIPT_URL;

export interface TestimonialData {
    id: number; // Tetap gunakan index sebagai ID sisi klien untuk key
    uuid: string;
    name: string;
    school: string;
    message: string;
}

export interface UsageLogData {
    type: string;
    school_name: string;
}

/**
 * Fungsi generik untuk berkomunikasi dengan Google Apps Script.
 * Menggunakan metode POST dengan 'text/plain' yang berisi JSON mentah.
 * Ini adalah metode yang sangat stabil untuk menghindari masalah CORS dan parsing.
 * @param {object} payload - Objek yang berisi 'action' dan 'data' (opsional).
 * @returns {Promise<any>} Data yang dikembalikan dari Apps Script.
 * @throws {Error} Jika terjadi kesalahan jaringan atau kesalahan dari sisi skrip.
 */
const callGAS = async (payload: object): Promise<any> => {
    if (!SCRIPT_URL) {
        throw new Error("URL Google Apps Script tidak dikonfigurasi.");
    }

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                // Menggunakan text/plain adalah cara yang lebih andal untuk mengirim JSON ke Apps Script.
                'Content-Type': 'text/plain;charset=utf-8',
            },
            // Body sekarang adalah string JSON mentah.
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gagal berkomunikasi dengan server: ${response.status} ${response.statusText}. Respons: ${errorBody}`);
        }

        // FIX: Type result as any to allow property access from the JSON response.
        const result: any = await response.json();

        if (result.status === 'success') {
            return result.data;
        } else {
            // Lemparkan pesan error yang lebih spesifik dari server jika ada.
            console.error("Error from GAS:", result);
            throw new Error(result.message || 'Terjadi kesalahan tidak diketahui dari Apps Script');
        }
    } catch (error) {
        console.error("Kesalahan saat berkomunikasi dengan Google Sheet:", error);
        throw error; // Lemparkan kembali error untuk ditangani oleh fungsi pemanggil.
    }
};


/**
 * Mengambil data testimoni yang disetujui.
 */
export const getTestimonials = async (): Promise<TestimonialData[]> => {
    try {
        const data = await callGAS({ action: 'getTestimonials' });
        // Tambahkan 'id' sisi klien untuk keperluan key React
        return (data || []).map((testimonial: any, index: number) => ({
            id: index,
            uuid: testimonial.uuid,
            name: testimonial.name,
            school: testimonial.school,
            message: testimonial.message,
        }));
    } catch (error) {
        console.error("Gagal memproses data testimoni:", error);
        throw error;
    }
};

/**
 * Mengambil jumlah total testimoni secara efisien.
 */
export const getTotalTestimonialCount = async (): Promise<number> => {
    try {
        const count = await callGAS({ action: 'getTotalTestimonialCount' });
        return typeof count === 'number' ? count : 0;
    } catch (error) {
        console.error("Gagal mengambil jumlah testimoni:", error);
        return 0; // Kembalikan 0 jika terjadi error agar tidak merusak UI
    }
};


/**
 * Mengambil data log penggunaan.
 */
export const getUsageLogs = async (): Promise<UsageLogData[]> => {
     try {
        const data = await callGAS({ action: 'getUsageLogs' });
        return data || [];
    } catch (error) {
        console.error("Gagal memproses data log penggunaan:", error);
        throw error;
    }
};

/**
 * Mencatat log penggunaan fitur.
 */
export const logUsage = async (usageData: { type: string; school_name: string; teacher_name: string; subject: string; }) => {
    try {
        await callGAS({ action: 'logUsage', data: usageData });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
};

/**
 * Mengirim testimoni baru.
 */
export const submitTestimonial = async (testimonialData: { name: string; school: string; message: string; }) => {
     try {
        await callGAS({ action: 'addTestimonial', data: testimonialData });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
};
