# Panduan Konfigurasi Google Sheets (CRUD Lengkap & Stabil) untuk Gendhis

Dokumen ini akan memandu Anda secara rinci untuk menyiapkan Google Sheets sebagai backend gratis yang mendukung operasi **Create, Read, Update, dan Delete (CRUD)** untuk aplikasi Gendhis.

## Konsep Dasar (SANGAT PENTING!)
- **Semua via POST `text/plain`:** Untuk stabilitas maksimum dan menghindari masalah keamanan browser (CORS), semua operasi akan dikirim menggunakan metode `POST` dengan `Content-Type: text/plain`, di mana body-nya adalah string JSON. Ini adalah metode yang paling andal.
- **Keamanan:** Operasi yang bersifat merusak (Update, Delete) akan diamankan menggunakan sebuah **kunci API rahasia** yang hanya diketahui oleh Anda dan aplikasi.
- **Tanpa Publikasi Web:** Dengan metode ini, Anda **TIDAK PERLU** mempublikasikan tab sheet Anda ke web. Semua data akan dibaca melalui Apps Script, yang lebih aman.

---

## Langkah 1: Siapkan Google Sheet

1.  Buka [sheets.google.com](https://sheets.google.com/) dan buat **Spreadsheet baru**.
2.  Beri nama spreadsheet Anda, misalnya `Gendhis App Database`.
3.  Buat dua tab (worksheet) di bagian bawah. Ganti nama defaultnya menjadi:
    *   `testimonials`
    *   `usage_logs`

### A. Siapkan Tab `testimonials`
Buat header kolom berikut di baris pertama (dari sel A1 hingga F1). **Kolom `uuid` sangat penting!**
`timestamp` | `name` | `school` | `message` | `is_approved` | `uuid`

*   **`is_approved`**: Kolom untuk moderasi. Isi dengan `TRUE` (huruf besar) untuk setiap testimoni yang ingin Anda tampilkan. Skrip akan otomatis mengisi `TRUE` untuk data baru.
*   **`uuid`**: Kolom ini akan diisi secara otomatis oleh skrip untuk memberikan ID unik pada setiap entri.

### B. Siapkan Tab `usage_logs`
Buat header kolom berikut di baris pertama (dari sel A1 hingga E1):
`timestamp` | `type` | `school_name` | `teacher_name` | `subject`

---

## Langkah 2: Buat & Deploy Google Apps Script (Versi Perbaikan Stabilitas)

Ini adalah "otak" yang akan menerima semua permintaan dari aplikasi Gendhis.

1.  Di dalam Google Sheet Anda, buka **Extensions > Apps Script**.
2.  Hapus semua kode placeholder di editor `Code.gs`.
3.  **Salin dan tempel SELURUH kode skrip di bawah ini** ke dalam editor:

```javascript
// =================================================================
// KONFIGURASI WAJIB
// =================================================================

// 1. Ganti dengan ID Spreadsheet Anda.
//    (Dapatkan dari URL: https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit)
const SPREADSHEET_ID = "GANTI_DENGAN_ID_SPREADSHEET_ANDA";

// 2. Buat sebuah kunci rahasia yang kuat untuk operasi Update & Delete.
//    Contoh: "KunciSangatRahasiaGendhis123!"
const SECRET_API_KEY = "GANTI_DENGAN_KUNCI_RAHASIA_ANDA";

// =================================================================
// KODE UTAMA (Jangan diubah kecuali Anda tahu apa yang Anda lakukan)
// =================================================================

const sheetDb = SpreadsheetApp.openById(SPREADSHEET_ID);
const testimonialsSheet = sheetDb.getSheetByName("testimonials");
const usageLogsSheet = sheetDb.getSheetByName("usage_logs");

/**
 * Titik masuk utama untuk semua permintaan POST.
 * Metode ini membaca body permintaan sebagai teks mentah dan mem-parsingnya sebagai JSON.
 * Ini adalah pendekatan yang paling andal untuk menangani permintaan dari frontend.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Permintaan tidak valid. Data POST tidak ditemukan.");
    }
    
    // Karena klien mengirim 'Content-Type: text/plain', kita bisa langsung parse kontennya sebagai JSON.
    const request = JSON.parse(e.postData.contents);
    const responseData = handleRequest(request);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", data: responseData }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Log error yang lebih detail ke sisi server untuk debugging.
    console.error("Error in doPost:", err.message, err.stack);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Memproses permintaan yang telah diparsing dan mengarahkannya
 * ke fungsi handler yang sesuai.
 */
function handleRequest(request) {
  const { action, data, apiKey } = request;

  switch (action) {
    // Read operations
    case "getTestimonials":
      const testimonials = sheetDataToJson(testimonialsSheet);
      return testimonials.filter(row => row.is_approved);
    case "getUsageLogs":
      return sheetDataToJson(usageLogsSheet);
    case "getTotalTestimonialCount": // Aksi baru yang efisien
      return getTotalTestimonialCount();

    // Create operations
    case "addTestimonial":
      return addTestimonial(data);
    case "logUsage":
      return logUsage(data);

    // Secured operations
    case "updateTestimonial":
      if (apiKey !== SECRET_API_KEY) throw new Error("Otentikasi gagal.");
      return updateTestimonial(data);
    case "deleteTestimonial":
      if (apiKey !== SECRET_API_KEY) throw new Error("Otentikasi gagal.");
      return deleteTestimonial(data);

    default:
      throw new Error(`Tindakan tidak valid: "${action}"`);
  }
}

// --- FUNGSI-FUNGSI HANDLER ---

function addTestimonial(data) {
  const uuid = Utilities.getUuid();
  // Mengubah 'false' menjadi 'true' untuk persetujuan otomatis sesuai permintaan.
  testimonialsSheet.appendRow([ new Date(), data.name, data.school, data.message, true, uuid ]);
  return { message: "Testimoni berhasil ditambahkan dan disetujui secara otomatis.", uuid };
}

function logUsage(data) {
  usageLogsSheet.appendRow([ new Date(), data.type, data.school_name, data.teacher_name, data.subject ]);
  return { message: "Log berhasil dicatat." };
}

function updateTestimonial(data) {
  const rowIndex = findRowIndexByUuid(testimonialsSheet, data.uuid);
  if (rowIndex === -1) throw new Error("Testimoni dengan UUID tersebut tidak ditemukan.");
  
  if (data.name !== undefined) testimonialsSheet.getRange(rowIndex, 2).setValue(data.name);
  if (data.school !== undefined) testimonialsSheet.getRange(rowIndex, 3).setValue(data.school);
  if (data.message !== undefined) testimonialsSheet.getRange(rowIndex, 4).setValue(data.message);
  if (typeof data.is_approved === 'boolean') testimonialsSheet.getRange(rowIndex, 5).setValue(data.is_approved);
  
  return { message: "Testimoni berhasil diperbarui.", uuid: data.uuid };
}

function deleteTestimonial(data) {
  const rowIndex = findRowIndexByUuid(testimonialsSheet, data.uuid);
  if (rowIndex === -1) throw new Error("Testimoni dengan UUID tersebut tidak ditemukan.");
  testimonialsSheet.deleteRow(rowIndex);
  return { message: "Testimoni berhasil dihapus.", uuid: data.uuid };
}

// --- FUNGSI-FUNGSI HELPER ---

// Fungsi baru yang efisien untuk menghitung total testimoni
function getTotalTestimonialCount() {
    const lastRow = testimonialsSheet.getLastRow();
    // Jika sheet kosong atau hanya ada header, kembalikan 0.
    return lastRow > 1 ? lastRow - 1 : 0;
}

function findRowIndexByUuid(sheet, uuid) {
  if (!uuid || sheet.getLastRow() < 2) return -1;
  const uuids = sheet.getRange(2, 6, sheet.getLastRow() - 1, 1).getValues().flat();
  const index = uuids.indexOf(uuid);
  return index !== -1 ? index + 2 : -1;
}

function sheetDataToJson(sheet) {
  if (sheet.getLastRow() < 2) return [];
  const [header, ...rows] = sheet.getDataRange().getValues();
  return rows.map(row =>
    header.reduce((obj, key, i) => {
      obj[key] = row[i];
      return obj;
    }, {})
  );
}
```

4.  **Dapatkan ID Spreadsheet Anda:**
    *   Lihat URL Google Sheet Anda. Salin bagian yang ada di antara `/d/` dan `/edit`.
    *   **Tempelkan ID ini** untuk menggantikan `"GANTI_DENGAN_ID_SPREADSHEET_ANDA"` di dalam kode skrip.

5.  **Atur Kunci Rahasia Anda:**
    *   Ganti `"GANTI_DENGAN_KUNCI_RAHASIA_ANDA"` dengan kata sandi yang kuat dan unik. Simpan kunci ini, karena akan dibutuhkan jika Anda ingin membuat fitur admin di masa depan.

6.  **Deploy Ulang Skrip Anda:**
    *   Di kanan atas, klik **"Deploy" > "Manage deployments"**.
    *   Pilih deployment Anda yang sudah ada, lalu klik ikon pensil (Edit).
    *   Di bawah "Version", pilih **"New version"**.
    *   Klik **"Deploy"**.
    *   URL Web App Anda akan tetap sama.

## Selesai!

Setelah Anda memperbarui dan men-deploy ulang skrip di atas, aplikasi Gendhis akan dapat berkomunikasi dengan backend secara jauh lebih andal dan error "Failed to fetch" akan teratasi.