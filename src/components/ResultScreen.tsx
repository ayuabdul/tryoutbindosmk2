import React from 'react';
import { SubmissionPayload } from '../services/sheetService';
import { CheckCircle2, Download, LogOut, ShieldCheck, AlertTriangle, FileText, Check } from 'lucide-react';

interface ResultScreenProps {
  submission: SubmissionPayload;
  onLogout: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ submission, onLogout }) => {
  const handleDownloadReceipt = () => {
    let txt = `==========================================================\n`;
    txt += `  TANDA BUKTI PENYERAHAN UJIAN CBT — TAHUN 2026\n`;
    txt += `          SMK NEGERI 2 GORONTALO\n`;
    txt += `==========================================================\n\n`;
    txt += `ID Verifikasi   : ${submission.submissionId}\n`;
    txt += `Nama Siswa      : ${submission.nama}\n`;
    txt += `NISN            : ${submission.nisn}\n`;
    txt += `NIPD            : ${submission.nipd}\n`;
    txt += `Rombel          : ${submission.rombel}\n`;
    txt += `Program Keahlian: ${submission.jurusan}\n`;
    txt += `Mata Uji        : Bahasa Indonesia (Try Out TKA)\n`;
    txt += `Waktu Selesai   : ${submission.timestamp}\n`;
    txt += `Durasi Ujian    : ${submission.timeUsedFormatted}\n`;
    txt += `Status          : ${submission.status}\n`;
    txt += `Status Sync     : Terverifikasi di Google Spreadsheet Pengawas\n\n`;
    txt += `Catatan Penting:\n`;
    txt += `- Nilai dan kunci jawaban tersimpan di database pengawas dan\n`;
    txt += `  tidak ditampilkan pada bukti ini demi kerahasiaan ujian.\n`;
    txt += `- Simpan berkas tanda bukti ini sebagai bukti sah pengumpulan ujian.\n`;
    txt += `==========================================================\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bukti_CBT_${submission.nama.replace(/\s+/g, '_')}_${submission.nisn}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1c2430] flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-xl w-full mx-auto my-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
        {/* Verification Success Header */}
        <div className="text-center pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Penyerahan Berhasil
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#132a4c] mt-2">
            Tanda Bukti Penyerahan Ujian CBT
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Bahasa Indonesia (Try Out TKA) — SMK Negeri 2 Gorontalo
          </p>
        </div>

        {/* Verification Hash Badge */}
        <div className="my-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            KODE VERIFIKASI PENGUMPULAN
          </div>
          <div className="font-mono font-bold text-xs sm:text-sm text-[#132a4c] tracking-wider select-all mt-0.5">
            {submission.submissionId}
          </div>
        </div>

        {/* Student Identification Details */}
        <div className="space-y-2 text-xs text-gray-700 border-b border-gray-100 pb-4 mb-4">
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Nama Lengkap Peserta</span>
            <b className="text-gray-900 text-right">{submission.nama}</b>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Rombel / Kelas</span>
            <b className="text-gray-900">{submission.rombel}</b>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">NISN / NIPD</span>
            <span className="font-mono text-gray-800">{submission.nisn} / {submission.nipd}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Waktu Penyerahan</span>
            <span className="font-medium text-gray-800">{submission.timestamp}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Durasi Pengerjaan</span>
            <span className="font-medium text-gray-800">{submission.timeUsedFormatted}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Status Sinkronisasi</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Terkirim ke Google Spreadsheet
            </span>
          </div>
        </div>

        {/* Violations notice if any */}
        {submission.violationsCount > 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-900">
            <div className="font-bold flex items-center gap-1 text-red-800 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Catatan Integritas: {submission.violationsCount} Pelanggaran Tercatat</span>
            </div>
            <p className="text-[11px] text-red-700">
              Riwayat pengawasan telah dikirimkan ke pengawas untuk dievaluasi sesuai tata tertib ujian.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 mb-4 text-xs text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-[11px]">Sesi ujian selesai dengan tertib tanpa pelanggaran aturan layar penuh.</span>
          </div>
        )}

        {/* Notice: Requirement 8 (Student cannot see final answers or score) */}
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 mb-6 text-xs text-blue-900 leading-relaxed">
          <p className="font-bold text-[#132a4c] mb-1">
            🔒 Pengumuman Hasil Ujian:
          </p>
          <p className="text-[11px] text-blue-800">
            Sesuai petunjuk teknis ujian, rincian skor dan kunci jawaban ujian <b>tidak ditampilkan kepada peserta</b> dan telah dienkripsi untuk pengolahan nilai pihak sekolah. Pengumuman resmi akan disampaikan melalui wali kelas masing-masing.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleDownloadReceipt}
            className="w-full py-3 px-4 bg-[#132a4c] hover:bg-[#1e3a63] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Bukti Pengumpulan (.txt)</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Selesai &amp; Keluar</span>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 py-3">
        SMK Negeri 2 Gorontalo — Sistem CBT 2026
      </div>
    </div>
  );
};
