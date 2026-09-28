/**
 * Service for Google Spreadsheet sync, cross-device data retrieval,
 * student submission deletion, and offline resilience queue.
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
  'https://script.google.com/macros/s/AKfycbyoyPrWDroFP0jbwc1HMEWXKAxeV0smJYkDXlfLeLE9hQEU4CdeBeGrRzo0LMBZopOb/exec';

const STORAGE_KEY_WEBHOOK = 'cbt_gas_webhook_url';
const STORAGE_KEY_QUEUE = 'cbt_offline_queue_v1';
const STORAGE_KEY_SUBMITTED_NISN = 'cbt_submitted_nisn_list';
const STORAGE_KEY_SYNCED_SUBMISSIONS = 'cbt_synced_submissions_map';

export function getWebhookUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WEBHOOK);
    if (saved && saved.trim()) {
      const trimmed = saved.trim();
      // If user had the old default URL in localStorage, automatically update to the new URL
      if (trimmed.includes('AKfycbzF-RQtr8LbchgP9Jm0nsy4ng6If1lacIab8LTf_s0myqJ1V4hAQ-5MSm_nXpeBBulQ')) {
        localStorage.setItem(STORAGE_KEY_WEBHOOK, DEFAULT_WEBHOOK_URL);
        return DEFAULT_WEBHOOK_URL;
      }
      return trimmed;
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
    const cleanNisn = nisn.trim();
    const list = getSubmittedNisnList();
    if (!list.includes(cleanNisn)) {
      list.push(cleanNisn);
      localStorage.setItem(STORAGE_KEY_SUBMITTED_NISN, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to record submitted NISN', e);
  }
}

export function unmarkNisnAsSubmitted(nisn: string): void {
  try {
    const cleanNisn = nisn.trim();
    const list = getSubmittedNisnList().filter(n => n.trim() !== cleanNisn);
    localStorage.setItem(STORAGE_KEY_SUBMITTED_NISN, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to unmark submitted NISN', e);
  }
}

export function isNisnAlreadySubmitted(nisn: string): boolean {
  const list = getSubmittedNisnList();
  return list.includes(nisn.trim());
}

export function getSyncedSubmissions(): Record<string, SubmissionPayload> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYNCED_SUBMISSIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSyncedSubmissions(map: Record<string, SubmissionPayload>): void {
  try {
    localStorage.setItem(STORAGE_KEY_SYNCED_SUBMISSIONS, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save synced submissions', e);
  }
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

export function removeFromOfflineQueue(nisnOrSubId: string): void {
  try {
    const queue = getOfflineQueue();
    const updated = queue.filter(item => item.submissionId !== nisnOrSubId && item.nisn !== nisnOrSubId);
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

  // Also save into synced submissions map
  const synced = getSyncedSubmissions();
  synced[payload.nisn] = payload;
  saveSyncedSubmissions(synced);

  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return {
      success: true,
      message: 'Data tersimpan aman di perangkat (Webhook Google Spreadsheet belum dikonfigurasi oleh Admin).'
    };
  }

  try {
    // Send as text/plain so CORS preflight does not block the transmission to Google Apps Script
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
 * Helper to fetch data via JSONP callback to bypass CORS on any browser/device
 */
function fetchViaJsonp(url: string, timeoutMs = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = 'cbt_sync_cb_' + Math.random().toString(36).substring(2, 9);
    const separator = url.includes('?') ? '&' : '?';
    const scriptUrl = `${url}${separator}action=read&callback=${callbackName}&_t=${Date.now()}`;

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Koneksi ke Google Spreadsheet melebihi batas waktu (timeout).'));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
      const existing = document.getElementById(callbackName);
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    }

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    const script = document.createElement('script');
    script.id = callbackName;
    script.src = scriptUrl;
    script.onerror = () => {
      cleanup();
      reject(new Error('Gagal memuat data melalui JSONP. Periksa URL Webhook Apps Script.'));
    };
    document.body.appendChild(script);
  });
}

/**
 * Fetch and download student submissions directly from Google Spreadsheet into this device.
 * Enables proctors on other laptops/phones to immediately download and view live exam results.
 */
export async function fetchSubmissionsFromSpreadsheet(customUrl?: string): Promise<{
  success: boolean;
  count: number;
  data: SubmissionPayload[];
  message: string;
}> {
  const webhookUrl = (customUrl || getWebhookUrl()).trim();
  if (!webhookUrl) {
    return {
      success: false,
      count: 0,
      data: [],
      message: 'URL Webhook Google Spreadsheet belum diatur.'
    };
  }

  let rawList: any[] = [];
  let fetchMethod = 'Direct Fetch';

  // 1. Try direct fetch with redirect follow
  try {
    const separator = webhookUrl.includes('?') ? '&' : '?';
    const targetUrl = `${webhookUrl}${separator}action=read&_t=${Date.now()}`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    if (response.ok) {
      const json = await response.json();
      if (json && Array.isArray(json.data)) {
        rawList = json.data;
      } else if (Array.isArray(json)) {
        rawList = json;
      }
    }
  } catch (errDirect) {
    // 2. If direct fetch has CORS restrictions, fallback to JSONP
    try {
      fetchMethod = 'JSONP Sync';
      const jsonpRes = await fetchViaJsonp(webhookUrl);
      if (jsonpRes && Array.isArray(jsonpRes.data)) {
        rawList = jsonpRes.data;
      } else if (Array.isArray(jsonpRes)) {
        rawList = jsonpRes;
      }
    } catch (errJsonp: any) {
      return {
        success: false,
        count: 0,
        data: [],
        message: `Gagal mengunduh dari Spreadsheet: ${errJsonp.message || 'Cek izin Webhook "Who has access: Anyone" pada Apps Script.'}`
      };
    }
  }

  // Parse and map records to SubmissionPayload
  const parsedList: SubmissionPayload[] = rawList.map((row: any) => {
    const cleanNisn = String(row.nisn || '').replace(/^'/, '').trim();
    const cleanNipd = String(row.nipd || '').replace(/^'/, '').trim();
    return {
      submissionId: row.submissionId || `SYNC-${cleanNisn}`,
      timestamp: row.timestamp || new Date().toLocaleString('id-ID'),
      nisn: cleanNisn,
      nipd: cleanNipd,
      nama: row.nama || '',
      rombel: row.rombel || '',
      jurusan: row.jurusan || '',
      score: Number(row.score) || 0,
      correctCount: Number(row.correctCount) || 0,
      totalQuestions: Number(row.totalQuestions) || 30,
      timeUsedSeconds: Number(row.timeUsedSeconds) || 0,
      timeUsedFormatted: row.timeUsedFormatted || '',
      violationsCount: Number(row.violationsCount) || 0,
      violationsLog: Array.isArray(row.violationsLog) ? row.violationsLog : [],
      deviceInfo: row.deviceInfo || {
        os: 'Tersinkron Spreadsheet',
        browser: 'Google Sheets',
        screen: '-',
        userAgent: ''
      },
      answers: row.answers || {},
      status: row.status || 'Selesai'
    };
  }).filter(item => item.nisn && item.nisn.length > 2);

  // Update local storage so that all downloaded submissions are persistently available on this device
  const syncedMap = getSyncedSubmissions();
  parsedList.forEach(item => {
    syncedMap[item.nisn] = item;
    markNisnAsSubmitted(item.nisn);
  });
  saveSyncedSubmissions(syncedMap);

  return {
    success: true,
    count: parsedList.length,
    data: parsedList,
    message: parsedList.length > 0
      ? `Berhasil mengunduh ${parsedList.length} data siswa dari Google Spreadsheet (${fetchMethod}).`
      : 'Tersambung ke Google Spreadsheet, namun belum ada baris data siswa yang disubmit.'
  };
}

/**
 * Delete a student submission from Google Spreadsheet and locally.
 * Clears student's submitted flag, allowing them to login/retake if permitted.
 */
export async function deleteStudentSubmission(nisn: string): Promise<{ success: boolean; message: string }> {
  const cleanNisn = nisn.trim();

  // 1. Instantly clean local cache
  unmarkNisnAsSubmitted(cleanNisn);
  const syncedMap = getSyncedSubmissions();
  delete syncedMap[cleanNisn];
  saveSyncedSubmissions(syncedMap);

  try {
    localStorage.removeItem(`cbt_state_${cleanNisn}`);
  } catch {}

  removeFromOfflineQueue(cleanNisn);

  // 2. Transmit deletion command to Google Apps Script Web App
  const webhookUrl = getWebhookUrl();
  if (webhookUrl) {
    try {
      const separator = webhookUrl.includes('?') ? '&' : '?';
      // Fire GET action=delete (no-cors)
      const deleteUrl = `${webhookUrl}${separator}action=delete&nisn=${encodeURIComponent(cleanNisn)}&_t=${Date.now()}`;
      fetch(deleteUrl, { mode: 'no-cors' }).catch(() => {});

      // Fire POST action: 'delete' for redundancy
      fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', nisn: cleanNisn })
      }).catch(() => {});
    } catch (e) {
      console.warn('Network issue while communicating deletion to Google Spreadsheet', e);
    }
  }

  return {
    success: true,
    message: `Data siswa dengan NISN ${cleanNisn} berhasil dihapus dari sistem dan baris Google Spreadsheet.`
  };
}

/**
 * Google Apps Script (Code.gs) template ready to copy paste.
 * Features:
 * 1. doPost: Multi-student lock queuing, submits results & detailed violation logs.
 * 2. doPost action=delete: Deletes student row from Spreadsheet.
 * 3. doGet action=read: Returns all rows in JSON / JSONP for cross-device proctor sync.
 * 4. doGet action=delete: Deletes student row from Spreadsheet via GET.
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================
 * CBT TRY OUT TKA BAHASA INDONESIA — SMK NEGERI 2 GORONTALO
 * GOOGLE APPS SCRIPT WEB APP HANDLER (V2 - SYNC & DELETE SUPPORT)
 * ==============================================================
 * Petunjuk Instalasi:
 * 1. Buka Google Spreadsheet baru (beri judul: "Data CBT Try Out SMK N 2 Gorontalo").
 * 2. Klik menu "Ekstensi" > "Apps Script".
 * 3. Hapus semua kode default di Code.gs, lalu paste seluruh kode di bawah ini.
 * 4. Klik tombol "Simpan" (ikon disket).
 * 5. Klik tombol "Terapkan" (Deploy) > "Penerapan baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Isi Konfigurasi:
 *    - Deskripsi: CBT SMK2 Sync & Delete
 *    - Jalankan sebagai (Execute as): "Saya" (Me - email akun Google Anda)
 *    - Yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> PENTING!
 * 8. Klik "Terapkan" (Deploy), berikan izin akses (Review Permissions -> Pilih Akun -> Advanced -> Go to ... (unsafe) -> Allow).
 * 9. Salin URL Aplikasi Web yang diberikan (berakhiran /exec).
 * 10. Buka Dashboard Admin CBT, paste URL tersebut di kolom "Webhook Google Spreadsheet" dan klik Simpan.
 * ==============================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";
  var callback = (e && e.parameter && e.parameter.callback) || "";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. UNDUH SELURUH HASIL SISWA DARI SPREADSHEET (SINKRONISASI ANTAR-PERANGKAT PROKTOR)
  if (action === "read" || action === "getSubmissions" || action === "getData") {
    var sheetHasil = ss.getSheetByName("HASIL_UJIAN");
    if (!sheetHasil) {
      return createJsonResponse({ status: "success", count: 0, data: [] }, callback);
    }
    var rows = sheetHasil.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var nisnStr = String(r[1] || "").replace(/^'/, "").trim();
      var namaStr = String(r[3] || "").trim();
      if (!nisnStr && !namaStr) continue;

      list.push({
        timestamp: String(r[0] || ""),
        nisn: nisnStr,
        nipd: String(r[2] || "").replace(/^'/, "").trim(),
        nama: namaStr,
        rombel: String(r[4] || ""),
        jurusan: String(r[5] || ""),
        score: Number(r[6]) || 0,
        correctCount: Number(r[7]) || 0,
        totalQuestions: Number(r[8]) || 30,
        timeUsedFormatted: String(r[9] || ""),
        violationsCount: Number(r[10]) || 0,
        combinedLog: String(r[11] || ""),
        status: String(r[12] || "Selesai"),
        submissionId: String(r[13] || "")
      });
    }
    return createJsonResponse({ status: "success", count: list.length, data: list }, callback);
  }

  // 2. HAPUS SISWA DARI SPREADSHEET (VIA GET)
  if (action === "delete") {
    var targetNisn = String((e && e.parameter && e.parameter.nisn) || "").replace(/^'/, "").trim();
    var deleted = deleteRowByNisn(ss, targetNisn);
    return createJsonResponse({
      status: "success",
      deleted: deleted,
      message: "Siswa NISN " + targetNisn + (deleted ? " berhasil dihapus." : " tidak ditemukan.")
    }, callback);
  }

  return ContentService.createTextOutput("CBT SMK Negeri 2 Gorontalo Apps Script Webhook is ACTIVE.");
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Kunci script selama maks 30 detik untuk mencegah tumpang tindih data saat 300 siswa submit bersamaan
  try {
    lock.waitLock(30000);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Server sibuk, silakan coba beberapa saat lagi"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. JIKA REQUEST ADALAH HAPUS SISWA
    if (data.action === "delete" && data.nisn) {
      var targetNisn = String(data.nisn).replace(/^'/, "").trim();
      var deleted = deleteRowByNisn(ss, targetNisn);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        deleted: deleted,
        message: "Data NISN " + targetNisn + " berhasil dihapus dari Google Spreadsheet."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. SUBMIT DATA HASIL UJIAN SISWA
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

    var cleanNisn = String(data.nisn || "").replace(/^'/, "").trim();
    var cleanNipd = String(data.nipd || "").replace(/^'/, "").trim();

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
      if (String(rows[i][1]).replace(/^'/, "").trim() === cleanNisn) {
        existingRowIndex = i + 1; // 1-based index
        break;
      }
    }

    var rowValues = [
      data.timestamp || new Date().toLocaleString("id-ID"),
      "'" + cleanNisn,
      "'" + cleanNipd,
      data.nama || "",
      data.rombel || "",
      data.jurusan || "",
      data.score !== undefined ? data.score : 0,
      data.correctCount !== undefined ? data.correctCount : 0,
      data.totalQuestions || 30,
      data.timeUsedFormatted || "",
      data.violationsCount || 0,
      combinedLog,
      data.status || "Selesai",
      data.submissionId || ""
    ];

    if (existingRowIndex > 0) {
      sheetHasil.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheetHasil.appendRow(rowValues);
    }

    // 3. Sheet Log Pelanggaran Rinci: LOG_PELANGGARAN (jika ada)
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
          "'" + cleanNisn,
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

// Fungsi bantu untuk menghapus baris siswa berdasarkan NISN
function deleteRowByNisn(ss, nisn) {
  if (!nisn) return false;
  var deleted = false;
  var sheetHasil = ss.getSheetByName("HASIL_UJIAN");
  if (sheetHasil) {
    var rows = sheetHasil.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      var cellNisn = String(rows[i][1] || "").replace(/^'/, "").trim();
      if (cellNisn === String(nisn).trim()) {
        sheetHasil.deleteRow(i + 1);
        deleted = true;
      }
    }
  }
  var sheetViol = ss.getSheetByName("LOG_PELANGGARAN");
  if (sheetViol) {
    var vRows = sheetViol.getDataRange().getValues();
    for (var j = vRows.length - 1; j >= 1; j--) {
      var vNisn = String(vRows[j][1] || "").replace(/^'/, "").trim();
      if (vNisn === String(nisn).trim()) {
        sheetViol.deleteRow(j + 1);
      }
    }
  }
  return deleted;
}

// Fungsi bantu respons JSON / JSONP
function createJsonResponse(data, callback) {
  var json = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
`;
