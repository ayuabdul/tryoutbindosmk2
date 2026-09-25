import React, { useState, useMemo } from 'react';
import { ROMBELS, getStudentsByRombel, STUDENTS_DATA } from '../data/studentsData';
import { isNisnAlreadySubmitted } from '../services/sheetService';
import { validateExamToken } from '../services/tokenService';
import { ShieldAlert, CheckCircle2, UserCheck, AlertTriangle, Lock, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onStartExam: (student: {
    nama: string;
    nomor: string;
    rombel: string;
    jurusan: string;
    nipd: string;
    nisn: string;
    jk: 'L' | 'P';
  }) => void;
  onOpenAdmin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onStartExam, onOpenAdmin }) => {
  const [selectedRombel, setSelectedRombel] = useState<string>('12-APHP-1');
  const [selectedStudentNisn, setSelectedStudentNisn] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [customNomor, setCustomNomor] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [showGateModal, setShowGateModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Filter students based on selected Rombel
  const studentsInRombel = useMemo(() => {
    return getStudentsByRombel(selectedRombel);
  }, [selectedRombel]);

  // Filtered dropdown for search
  const filteredStudents = useMemo(() => {
    if (!searchName.trim()) return studentsInRombel;
    return studentsInRombel.filter(s =>
      s.nama.toLowerCase().includes(searchName.toLowerCase()) ||
      s.nisn.includes(searchName)
    );
  }, [studentsInRombel, searchName]);

  const currentStudent = useMemo(() => {
    return STUDENTS_DATA.find(s => s.nisn === selectedStudentNisn);
  }, [selectedStudentNisn]);

  // Check if selected student already submitted
  const isAlreadySubmitted = useMemo(() => {
    if (!selectedStudentNisn) return false;
    return isNisnAlreadySubmitted(selectedStudentNisn);
  }, [selectedStudentNisn]);

  const handleSelectRombel = (rombelId: string) => {
    setSelectedRombel(rombelId);
    setSelectedStudentNisn('');
    setSearchName('');
    setErrorMsg('');
  };

  const handleStudentPick = (nisn: string) => {
    setSelectedStudentNisn(nisn);
    const stu = STUDENTS_DATA.find(s => s.nisn === nisn);
    if (stu) {
      setCustomNomor(`${stu.rombel} - ${stu.nipd}`);
      if (isNisnAlreadySubmitted(nisn)) {
        setErrorMsg('Perhatian: Data Anda tercatat sudah pernah menyelesaikan ujian. Hubungi pengawas jika ingin mengulang karena kendala teknis.');
      } else {
        setErrorMsg('');
      }
    }
  };

  const handlePrepareStart = () => {
    if (!currentStudent) {
      setErrorMsg('Silakan pilih nama peserta terlebih dahulu.');
      return;
    }

    if (!tokenInput.trim()) {
      setErrorMsg('Token Ujian wajib diisi. Silakan minta Token kepada Pengawas Ruang.');
      return;
    }

    if (!validateExamToken(tokenInput)) {
      setErrorMsg('Token Ujian tidak valid. Pastikan huruf besar/kecil sesuai dan tanyakan kepada Pengawas.');
      return;
    }

    if (isAlreadySubmitted) {
      const confirmOverride = window.confirm(
        'Data Anda sudah tercatat pernah mengumpulkan ujian ini.\nApakah Anda telah mendapatkan izin dari Pengawas Ruang untuk memulai ulang?'
      );
      if (!confirmOverride) return;
    }

    setShowGateModal(true);
  };

  const handleConfirmStart = async () => {
    setShowGateModal(false);

    // Request fullscreen for exam security
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen permission not granted or unsupported:', e);
    }

    if (currentStudent) {
      onStartExam({
        nama: currentStudent.nama,
        nomor: customNomor || `${currentStudent.rombel} - ${currentStudent.nipd}`,
        rombel: currentStudent.rombel,
        jurusan: currentStudent.jurusan,
        nipd: currentStudent.nipd,
        nisn: currentStudent.nisn,
        jk: currentStudent.jk
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#132a4c] via-[#1e3a63] to-[#274a78] text-[#1c2430] flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Header bar */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between py-2 text-white/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg text-amber-300 border border-white/20">
            SMK2
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-300 font-semibold">SMK NEGERI 2 GORONTALO</div>
            <div className="text-sm font-bold tracking-tight">Sistem Ujian CBT Terintegrasi</div>
          </div>
        </div>

        <button
          onClick={onOpenAdmin}
          className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 transition-all border border-white/20 px-3 py-1.5 rounded-lg text-white font-medium"
        >
          <Lock className="w-3.5 h-3.5 text-amber-300" />
          <span>Portal Guru / Pengawas</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 my-4 border border-white/40">
        <div className="border-b border-gray-100 pb-4 mb-6">
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 mb-2">
            TAHUN PELAJARAN 2025/2026
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#132a4c] leading-tight">
            CBT Try Out TKA
            <span className="block text-lg sm:text-xl font-sans font-medium text-gray-600 mt-1">
              Bahasa Indonesia — SMK Negeri 2 Gorontalo
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Waktu pengerjaan: <b>90 Menit</b> • 30 Soal Evaluasi • Mode Pengawasan Real-Time
          </p>
        </div>

        <div className="space-y-5">
          {/* Step 1: Select Rombel */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#132a4c] mb-2 flex items-center justify-between">
              <span>1. Pilih Rombel / Kelas Anda</span>
              <span className="text-gray-400 font-normal">11 Rombel Tersedia</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROMBELS.map(r => {
                const isSelected = selectedRombel === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRombel(r.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-[#1e3a63] bg-blue-50/80 text-[#132a4c] ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-base">{r.icon}</span>
                    <div className="truncate">
                      <div className="font-bold">{r.id}</div>
                      <div className="text-[10px] text-gray-500 font-normal truncate">{r.jurusan}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Student Name (filtered dynamically by Rombel) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#132a4c] mb-2 flex items-center justify-between">
              <span>2. Pilih Nama Peserta ({studentsInRombel.length} Siswa)</span>
              {currentStudent && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                </span>
              )}
            </label>

            {/* Quick search input */}
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Ketik untuk mencari nama Anda..."
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a63] focus:ring-1 focus:ring-[#1e3a63]"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
            </div>

            <select
              value={selectedStudentNisn}
              onChange={e => handleStudentPick(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#1e3a63] bg-white transition-colors"
            >
              <option value="">-- Klik untuk memilih nama Anda --</option>
              {filteredStudents.map(s => (
                <option key={s.nisn} value={s.nisn}>
                  {s.no}. {s.nama} ({s.jk === 'L' ? 'Laki-laki' : 'Perempuan'}) - NISN: {s.nisn}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Verified Student Details */}
          {currentStudent && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5 animate-fadeIn">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Informasi Peserta Terpilih</div>
              <div className="grid grid-cols-2 gap-2 text-gray-800">
                <div>
                  <span className="text-gray-500">Nama:</span> <b className="text-[#132a4c]">{currentStudent.nama}</b>
                </div>
                <div>
                  <span className="text-gray-500">Rombel:</span> <b>{currentStudent.rombel}</b>
                </div>
                <div>
                  <span className="text-gray-500">NISN:</span> <span className="font-mono">{currentStudent.nisn}</span>
                </div>
                <div>
                  <span className="text-gray-500">NIPD:</span> <span className="font-mono">{currentStudent.nipd}</span>
                </div>
              </div>

              {isAlreadySubmitted && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <b>Peringatan Duplikasi:</b> Peserta dengan NISN ini sudah tercatat menyelesaikan ujian di sistem. Hubungi pengawas ruang jika ingin mengulang.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Token Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#132a4c] mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#132a4c]" />
                3. Masukkan Token Ujian
              </span>
              <span className="text-gray-400 font-normal">Diberikan oleh Pengawas</span>
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={12}
                placeholder="Contoh: TKA2026"
                value={tokenInput}
                onChange={e => {
                  setTokenInput(e.target.value.toUpperCase());
                  setErrorMsg('');
                }}
                className="w-full uppercase font-mono tracking-widest text-center text-lg sm:text-xl font-bold p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#132a4c] focus:ring-2 focus:ring-blue-100 transition-all bg-amber-50/30 text-[#132a4c]"
              />
            </div>
          </div>

          {/* Rules & Anti-Cheat Summary */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-amber-950 mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Tata Tertib &amp; Sistem Pemantauan Ujian</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
              <li>Ujian wajib dikerjakan dalam mode <b>Layar Penuh (Fullscreen)</b>.</li>
              <li>Aktivitas berpindah aplikasi, beralih tab, meminimalkan layar, atau membuka floating apps akan <b>langsung terdeteksi dan tercatat pada Dashboard Pengawas</b>.</li>
              <li>Jika melanggar 3 kali atau lebih, <b>soal ujian tidak akan terkunci</b> sehingga Anda tetap dapat menyelesaikan ujian, namun seluruh log pelanggaran dan riwayat waktu akan dilaporkan secara transparan ke Google Spreadsheet Pengawas.</li>
              <li>Kerahasiaan terjaga: <b>kunci jawaban akhir tidak ditampilkan kepada siswa</b>.</li>
            </ul>
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Start Exam Button */}
          <button
            type="button"
            disabled={!currentStudent || !tokenInput.trim()}
            onClick={handlePrepareStart}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide text-white transition-all shadow-md flex items-center justify-center gap-2 ${
              currentStudent && tokenInput.trim()
                ? 'bg-[#132a4c] hover:bg-[#1e3a63] cursor-pointer hover:shadow-lg active:scale-[0.99]'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Mulai Pengerjaan Ujian</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-2xl w-full mx-auto text-center text-xs text-white/60 py-2">
        CBT Try Out TKA • SMK Negeri 2 Gorontalo © 2026 • Monitoring Real-time &amp; Token Terproteksi
      </div>

      {/* Ready Gate Modal */}
      {showGateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#132a4c] flex items-center justify-center mx-auto mb-4 text-2xl border border-blue-100">
              🖥️
            </div>
            <h3 className="text-xl font-serif font-bold text-[#132a4c]">
              Konfirmasi Memulai Ujian
            </h3>
            <p className="text-xs text-gray-600 mt-2 mb-4 leading-relaxed">
              Halo <b>{currentStudent?.nama}</b> ({currentStudent?.rombel}), tombol di bawah akan mengaktifkan <b>Mode Layar Penuh</b> dan memulai hitung mundur <b>90 menit</b>.
              <br /><br />
              Pastikan Anda tetap berada di halaman ujian dan tidak berpindah aplikasi selama ujian berlangsung.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowGateModal(false)}
                className="flex-1 py-2.5 px-3 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmStart}
                className="flex-2 py-2.5 px-4 bg-[#132a4c] hover:bg-[#1e3a63] text-white rounded-xl text-xs font-bold shadow-md"
              >
                Masuk Mode Ujian &amp; Layar Penuh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
