# CBT Try Out TKA Bahasa Indonesia — SMK Negeri 2 Gorontalo

Aplikasi Computer-Based Testing (CBT) modern berbasis web yang dirancang khusus untuk pelaksanaan Try Out TKA Bahasa Indonesia SMK Negeri 2 Gorontalo. Aplikasi ini memiliki ketahanan tinggi untuk digunakan oleh **300+ siswa secara bersamaan**, terintegrasi langsung dengan **Google Spreadsheet via Google Apps Script (Webhook)**, dilengkapi sistem **Anti-Cheat (deteksi beralih aplikasi, split screen, floating screen recorder)**, dan **Dashboard Monitoring Real-time** untuk pengawas.

---

## 🌟 Fitur Utama

1. **Sinkronisasi Langsung ke Google Spreadsheet (Apps Script)**:
   - Data pengumpulan ujian dan riwayat pelanggaran langsung tercatat otomatis ke Google Spreadsheet saat siswa menekan tombol "Selesai".
   - Dilengkapi *Client-side Offline Queue & Exponential Retry*, sehingga jika 300 siswa menekan tombol kumpulkan pada detik yang sama, data tetap tersimpan aman di perangkat dan tidak akan hilang/terputus.
2. **Validasi Rombel & Pencegahan Duplikasi (294 Siswa Terdaftar)**:
   - Siswa memilih Rombel terlebih dahulu (11 Rombel: `12-APHP-1`, `12-APHP-2`, `12-BUSANA`, `12-CANTIK-1`, `12-CANTIK-2`, `12-DKV-1`, `12-DKV-2`, `12-HOTEL-1`, `12-HOTEL-2`, `12-HOTEL-3`, `12-KULINER`).
   - Pilihan nama siswa otomatis menyesuaikan dengan rombel yang dipilih.
   - NISN & NIPD otomatis terverifikasi.
   - Sistem memblokir upaya pengerjaan ulang (duplikasi) dengan NISN yang sama kecuali telah direset oleh Pengawas.
3. **UI Nyaman & Responsif untuk Handphone**:
   - Tata letak mobile-first dengan area sentuh nyaman (touch target > 44px).
   - Bilah navigasi bawah (bottom action bar) khusus HP dengan drawer daftar nomor soal yang mudah diakses tanpa harus scroll panjang.
   - Teks wacana/bacaan diformat ramah baca dengan tipografi yang bersih.
4. **Isolasi Penuh & Kerahasiaan Kunci Jawaban**:
   - Siswa tidak dapat melihat jawaban siswa lain selama ujian.
   - Siswa **tidak dapat melihat nilai akhir dan kunci jawaban** setelah selesai ujian. Sebagai gantinya, siswa menerima **Tanda Bukti Penyerahan Resmi** berisi ID Verifikasi dan waktu pengumpulan.
5. **Sistem Keamanan Anti-Kecurangan (Anti-Cheat & Telemetry)**:
   - Memaksa mode Layar Penuh (Fullscreen).
   - Mendeteksi perpindahan tab, minimize browser, split screen, floating apps, atau pembukaan aplikasi lain (WhatsApp, screen recorder).
   - Mencegah klik kanan, copy, cut, paste, dan pintasan keyboard devtools (Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I).
   - **Ketentuan Pelanggaran (≥ 3 Kali)**: Jika siswa melanggar 3 kali atau lebih, **soal ujian tidak akan terkunci** sehingga siswa tetap dapat menyelesaikan ujian, namun seluruh riwayat, waktu, dan jumlah pelanggaran tetap terdeteksi secara real-time pada Dashboard Monitoring Pengawas dan otomatis terkirim ke Google Spreadsheet.
6. **Sistem Token Ujian**:
   - Siswa wajib memasukkan Token Ujian yang diberikan oleh pengawas ruang sebelum dapat memulai ujian (Default: `TKA2026`).
   - Pengawas dapat melihat, mengubah, atau mengacak token baru kapan saja melalui Portal Guru.
7. **Portal Guru & Dashboard Monitoring Real-time**:
   - Dilindungi kata sandi rahasia khusus pengawas (kata sandi tidak pernah ditampilkan di layar siswa dan dapat diperbarui dari dalam portal).
   - Pengaturan Webhook Google Spreadsheet & antrean data offline **hanya dapat diakses melalui Portal Guru**.
   - Memantau progres seluruh 294 siswa secara real-time dengan filter khusus siswa yang melanggar ≥ 3 kali.
   - Menampilkan log perangkat setiap siswa (OS, Browser, Resolusi Layar, User Agent).
   - Ekspor rekap nilai dan log lengkap langsung ke format Excel/CSV.
   - Fitur reset sesi siswa jika terjadi kendala teknis perangkat di ruangan.

---

## 📋 Langkah-Langkah Integrasi Google Spreadsheet & Apps Script

Untuk mengaktifkan sinkronisasi otomatis ke Google Spreadsheet:

### Langkah 1: Buat Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama file: `Data CBT TKA SMK Negeri 2 Gorontalo`.

### Langkah 2: Buka Editor Apps Script
1. Di menu Google Sheet, klik **Ekstensi (Extensions)** > **Apps Script**.
2. Hapus seluruh baris kode yang ada di file `Code.gs`.

### Langkah 3: Tempelkan Kode Apps Script
Salin seluruh kode berikut dan tempelkan ke `Code.gs`:

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Mencegah race condition saat 300 siswa submit bersamaan
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

    var violSummary = "";
    if (data.violationsLog && data.violationsLog.length > 0) {
      violSummary = data.violationsLog.map(function(v) {
        return "[" + v.time + "] " + v.msg;
      }).join("\n");
    } else {
      violSummary = "Bersih (Tidak ada pelanggaran)";
    }
    
    var devInfo = data.deviceInfo ? 
      ("OS: " + data.deviceInfo.os + " | Browser: " + data.deviceInfo.browser + " | Layar: " + data.deviceInfo.screen) : "-";
    var combinedLog = "DEVICE: " + devInfo + "\n\nPELANGGARAN:\n" + violSummary;

    // Cek duplikasi NISN
    var rows = sheetHasil.getDataRange().getValues();
    var existingRowIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim() === String(data.nisn).trim()) {
        existingRowIndex = i + 1;
        break;
      }
    }

    var rowValues = [
      data.timestamp || new Date().toLocaleString("id-ID"),
      "'" + String(data.nisn),
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
      sheetHasil.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheetHasil.appendRow(rowValues);
    }

    // 2. Sheet Log Pelanggaran Rinci
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
  var action = (e && e.parameter && e.parameter.action) || "";
  var callback = (e && e.parameter && e.parameter.callback) || "";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. UNDUH SELURUH HASIL SISWA (SINKRONISASI ANTAR-PERANGKAT PROKTOR)
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

function createJsonResponse(data, callback) {
  var json = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Langkah 4: Terapkan (Deploy) Web App
1. Klik tombol **Simpan (Save)**.
2. Klik tombol biru **Terapkan (Deploy)** di kanan atas > pilih **Kelola penerapan (Manage deployments)** atau **Penerapan baru (New deployment)**.
3. Klik ikon gerigi > pilih jenis **Aplikasi Web (Web app)**.
4. Isi konfigurasi:
   - Deskripsi: `CBT SMK2 Sync & Delete`
   - Jalankan sebagai (*Execute as*): **Saya (email Anda)**
   - Yang memiliki akses (*Who has access*): **Siapa saja (Anyone)** *(PENTING!)*
5. Klik **Terapkan (Deploy)**.
6. Berikan izin akses (*Review Permissions* > Pilih Akun > *Advanced* > *Go to ... (unsafe)* > *Allow*).
7. Salin **URL Aplikasi Web** (berakhiran `/exec`).

### Langkah 5: Fitur Sinkronisasi Lintas Perangkat & Hapus Siswa
1. **Unduh Data di Device Lain**: Jika pengawas membuka Dashboard Admin di laptop/HP lain, cukup klik tombol biru **"Sinkronkan Data"** di bagian atas atau **"Sinkronkan Spreadsheet"** di bilah filter. Seluruh baris data siswa yang telah submit di Google Spreadsheet akan langsung terunduh dan masuk ke monitoring secara instan!
2. **Hapus Siswa & Spreadsheet**: Pengawas dapat mengklik tombol ikon sampah merah (🗑️) di baris siswa untuk menghapus siswa tersebut dari daftar dan **otomatis menghapus barisnya di Google Spreadsheet**. Siswa yang dihapus dapat login kembali untuk mengerjakan ujian ulang jika diizinkan pengawas.
3. **Pencegahan Mengakhiri Ujian**: Siswa **tidak dapat mengumpulkan ujian sebelum menjawab lengkap seluruh 30 butir soal**. Jika ada soal yang terlewat, muncul dialog interaktif berisi daftar nomor soal yang belum terisi agar siswa dapat langsung membukanya.

---

## 🚀 Panduan Publikasi ke GitHub (GitHub Pages)

Aplikasi ini dibangun menggunakan Vite + React + TypeScript dan dapat dipublikasikan ke GitHub secara gratis melalui **GitHub Pages**:

### Langkah 1: Siapkan Repository di GitHub
1. Buat repository baru di [GitHub](https://github.com/new), misalnya dengan nama `cbt-smkn2-gorontalo`.
2. Pastikan repository diset sebagai **Public**.

### Langkah 2: Push Kode ke GitHub
Jalankan perintah berikut di terminal:
```bash
git init
git add .
git commit -m "feat: CBT SMK Negeri 2 Gorontalo lengkap dengan Anti-Cheat dan Google Spreadsheet sync"
git branch -M main
git remote add origin https://github.com/<USERNAME-ANDA>/cbt-smkn2-gorontalo.git
git push -u origin main
```

### Langkah 3: Periksa GitHub Actions & Dapatkan Link Aplikasi
1. File workflow otomatis `.github/workflows/deploy.yml` dan konfigurasi `base: './'` pada `vite.config.ts` **sudah tersedia dan siap pakai**.
2. Lakukan push perubahan terbaru ke GitHub:
   ```bash
   git add .
   git commit -m "fix: tambahkan workflow github actions dan base url vite"
   git push origin main
   ```
3. Buka tab **Actions** di repository GitHub Anda:
   - Anda akan melihat workflow **Deploy to GitHub Pages** sedang berjalan otomatis (indikator kuning berputar).
   - Tunggu sekitar 30–60 detik hingga muncul tanda **Centang Hijau (Success)**.
4. Buka tab **Settings** > **Pages**:
   - Link website aplikasi CBT Anda akan langsung muncul di bagian atas:
   - Contoh: `https://<USERNAME-ANDA>.github.io/<NAMA-REPO>/`
5. Aplikasi CBT SMK Negeri 2 Gorontalo sekarang sudah dapat langsung diakses oleh seluruh siswa dari HP atau komputer manapun!

---

## 🔐 Informasi Akses Pengawas
- **Default PIN Pengawas**: `admin123` (atau `adminSMK2`)
- Tombol panel pengawas terletak di pojok kanan atas layar login peserta.

---

## 🏫 Pengembang
Dikembangkan untuk **SMK Negeri 2 Gorontalo** — Dinas Pendidikan & Kebudayaan Provinsi Gorontalo © 2026.
