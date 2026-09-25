/**
 * Service for Google Spreadsheet sync and offline resilience queue.
 * Optimized for high-concurrency (300+ students) with client-side queuing,
 * duplicate prevention, and automatic retries.
 */

export interface SubmissionPayload {
  submissionId: string;
  timestamp: string;
  nisn: string;
  nipd: string;
  nama: string;
  rombel: string;
  jurusan: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeUsedSeconds: number;
  timeUsedFormatted: string;
  violationsCount: number;
  violationsLog: Array<{ time: string; msg: string }>;
  deviceInfo: {
    os: string;
    browser: string;
    screen: string;
    userAgent: string;
  };
  answers: Record<number, any>;
  status: string;
}

export const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbzF-RQtr8LbchgP9Jm0nsy4ng6If1lacIab8LTf_s0myqJ1V4hAQ-5MSm_nXpeBBulQ/exec';

const STORAGE_KEY_WEBHOOK = 'cbt_gas_webhook_url';
const STORAGE_KEY_QUEUE = 'cbt_offline_queue_v1';
const STORAGE_KEY_SUBMITTED_NISN = 'cbt_submitted_nisn_list';

export function getWebhookUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WEBHOOK);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch {}
  return DEFAULT_WEBHOOK_URL;
}

export function saveWebhookUrl(url: string): void {
  try {
    const target = url.trim() || DEFAULT_WEBHOOK_URL;
    localStorage.setItem(STORAGE_KEY_WEBHOOK, target);
  } catch (e) {
    console.error('Failed to save webhook URL', e);
  }
}

export function getSubmittedNisnList(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBMITTED_NISN);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markNisnAsSubmitted(nisn: string): void {
  try {
    const list = getSubmittedNisnList();
    if (!list.includes(nisn)) {
      list.push(nisn);
      localStorage.setItem(STORAGE_KEY_SUBMITTED_NISN, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to record submitted NISN', e);
  }
}

export function isNisnAlreadySubmitted(nisn: string): boolean {
  const list = getSubmittedNisnList();
  return list.includes(nisn.trim());
}

export function getOfflineQueue(): SubmissionPayload[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(payload: SubmissionPayload): void {
  try {
    const queue = getOfflineQueue();
    // remove existing if same NISN to prevent duplicated queue
    const filtered = queue.filter(item => item.nisn !== payload.nisn);
    filtered.push(payload);
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to enqueue submission', e);
  }
}

export function removeFromOfflineQueue(submissionId: string): void {
  try {
    const queue = getOfflineQueue();
    const updated = queue.filter(item => item.submissionId !== submissionId);
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove from queue', e);
  }
}

/**
 * Send submission to Google Apps Script Web App
 */
export async function sendToGoogleSpreadsheet(payload: SubmissionPayload): Promise<{ success: boolean; message: string }> {
  // Always store locally first for 100% data safety
  addToOfflineQueue(payload);
  markNisnAsSubmitted(payload.nisn);

  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return {
      success: true,
      message: 'Data tersimpan aman di perangkat (Webhook Google Spreadsheet belum dikonfigurasi oleh Admin).'
    };
  }

  try {
    // We send payload as plain text / json string. Using mode: 'no-cors' guarantees that CORS preflight
    // does not block the transmission to Google Apps Script.
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    // Remove from queue on successful send
    removeFromOfflineQueue(payload.submissionId);

    return {
      success: true,
      message: 'Data berhasil disinkronkan ke Google Spreadsheet.'
    };
  } catch (error: any) {
    console.warn('Network error while sending to Google Spreadsheet, keeping in offline queue:', error);
    return {
      success: false,
      message: 'Koneksi lambat/terputus. Data disimpan aman di perangkat dan akan otomatis disinkronkan saat tersambung.'
    };
  }
}

/**
 * Background queue flusher (runs when network comes back online or periodic sync)
 */
export async function flushOfflineQueue(): Promise<{ sent: number; remaining: number }> {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) return { sent: 0, remaining: getOfflineQueue().length };

  const queue = getOfflineQueue();
  let sentCount = 0;

  for (const item of queue) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(item)
      });
      removeFromOfflineQueue(item.submissionId);
      sentCount++;
    } catch (e) {
      console.warn('Queue flush item failed, will retry next time:', e);
      break; // stop loop if still disconnected
    }
  }

  return { sent: sentCount, remaining: getOfflineQueue().length };
}

/**
 * Google Apps Script (Code.gs) template ready to copy paste.
 * Designed to handle 300 simultaneous submissions cleanly into Google Sheets
 * without race conditions or data loss.
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================
 * CBT TRY OUT TKA BAHASA INDONESIA — SMK NEGERI 2 GORONTALO
 * GOOGLE APPS SCRIPT WEB APP HANDLER
 * ==============================================================
 * Petunjuk Instalasi:
 * 1. Buka Google Spreadsheet baru (beri judul: "Data CBT Try Out SMK N 2 Gorontalo").
 * 2. Klik menu "Ekstensi" > "Apps Script".
 * 3. Hapus semua kode default di Code.gs, lalu paste seluruh kode di bawah ini.
 * 4. Klik tombol "Simpan" (ikon disket).
 * 5. Klik tombol "Terapkan" (Deploy) > "Penerapan baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Isi Konfigurasi:
 *    - Deskripsi: CBT SMK2 Sync
 *    - Jalankan sebagai (Execute as): "Saya" (Me - email akun Google Anda)
 *    - Yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> PENTING!
 * 8. Klik "Terapkan" (Deploy), berikan izin akses (Review Permissions -> Pilih Akun -> Advanced -> Go to ... (unsafe) -> Allow).
 * 9. Salin URL Aplikasi Web yang diberikan (berakhiran /exec).
 * 10. Buka Dashboard Admin CBT, paste URL tersebut di kolom "Webhook Google Spreadsheet" dan klik Simpan.
 * ==============================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Kunci script selama maks 30 detik untuk mencegah tumpang tindih data saat 300 siswa submit bersamaan
  try {
    lock.waitLock(30000);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Server busy, please retry"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sheet Utama: HASIL_UJIAN
    var sheetHasil = ss.getSheetByName("HASIL_UJIAN");
    if (!sheetHasil) {
      sheetHasil = ss.insertSheet("HASIL_UJIAN");
      sheetHasil.appendRow([
        "Waktu Submit",
        "NISN",
        "NIPD",
        "Nama Peserta",
        "Rombel",
        "Jurusan",
        "Nilai Akhir",
        "Jumlah Benar",
        "Total Soal",
        "Durasi Pengerjaan",
        "Jumlah Pelanggaran",
        "Riwayat Pelanggaran & Log Perangkat",
        "Status Ujian",
        "ID Submisi"
      ]);
      sheetHasil.getRange("A1:N1").setBackground("#132a4c").setFontColor("#ffffff").setFontWeight("bold");
      sheetHasil.setFrozenRows(1);
    }

    // Format log pelanggaran & perangkat
    var violSummary = "";
    if (data.violationsLog && data.violationsLog.length > 0) {
      violSummary = data.violationsLog.map(function(v) {
        return "[" + v.time + "] " + v.msg;
      }).join("\\n");
    } else {
      violSummary = "Bersih (Tidak ada pelanggaran)";
    }
    
    var devInfo = data.deviceInfo ? 
      ("OS: " + data.deviceInfo.os + " | Browser: " + data.deviceInfo.browser + " | Layar: " + data.deviceInfo.screen) : "-";
    var combinedLog = "DEVICE: " + devInfo + "\\n\\nPELANGGARAN:\\n" + violSummary;

    // Cek apakah NISN sudah ada (mencegah duplikasi data siswa)
    var rows = sheetHasil.getDataRange().getValues();
    var existingRowIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim() === String(data.nisn).trim()) {
        existingRowIndex = i + 1; // 1-based index
        break;
      }
    }

    var rowValues = [
      data.timestamp || new Date().toLocaleString("id-ID"),
      "'" + String(data.nisn), // format teks agar angka awal 0 tidak hilang
      "'" + String(data.nipd),
      data.nama,
      data.rombel,
      data.jurusan,
      data.score,
      data.correctCount,
      data.totalQuestions || 30,
      data.timeUsedFormatted || "",
      data.violationsCount || 0,
      combinedLog,
      data.status || "Selesai",
      data.submissionId || ""
    ];

    if (existingRowIndex > 0) {
      // Perbarui baris yang sudah ada jika siswa submit ulang atas izin pengawas
      sheetHasil.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      // Tambahkan baris baru
      sheetHasil.appendRow(rowValues);
    }

    // 2. Sheet Log Pelanggaran Rinci: LOG_PELANGGARAN (jika ada pelanggaran)
    if (data.violationsLog && data.violationsLog.length > 0) {
      var sheetViol = ss.getSheetByName("LOG_PELANGGARAN");
      if (!sheetViol) {
        sheetViol = ss.insertSheet("LOG_PELANGGARAN");
        sheetViol.appendRow(["Waktu Kejadian", "NISN", "Nama Peserta", "Rombel", "Detail Kejadian", "Perangkat"]);
        sheetViol.getRange("A1:F1").setBackground("#b3311f").setFontColor("#ffffff").setFontWeight("bold");
        sheetViol.setFrozenRows(1);
      }
      for (var j = 0; j < data.violationsLog.length; j++) {
        var vItem = data.violationsLog[j];
        sheetViol.appendRow([
          vItem.time,
          "'" + String(data.nisn),
          data.nama,
          data.rombel,
          vItem.msg,
          devInfo
        ]);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data berhasil dicatat"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("CBT SMK Negeri 2 Gorontalo Apps Script Webhook is ACTIVE.");
}
`;
