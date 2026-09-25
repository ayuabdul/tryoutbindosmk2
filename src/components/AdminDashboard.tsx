import React, { useState, useMemo, useEffect } from 'react';
import { STUDENTS_DATA, ROMBELS, Student } from '../data/studentsData';
import { calculateScore } from '../data/examData';
import {
  getWebhookUrl,
  saveWebhookUrl,
  getOfflineQueue,
  flushOfflineQueue,
  getSubmittedNisnList,
  GOOGLE_APPS_SCRIPT_CODE,
  SubmissionPayload
} from '../services/sheetService';
import {
  getExamToken,
  setExamToken,
  generateRandomToken,
  setAdminPassword
} from '../services/tokenService';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Download,
  RefreshCw,
  Copy,
  Check,
  Laptop,
  Eye,
  ArrowLeft,
  Settings,
  HelpCircle,
  FileSpreadsheet,
  KeyRound,
  ShieldCheck,
  Lock
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToLogin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToLogin }) => {
  const [selectedRombelFilter, setSelectedRombelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'monitoring' | 'webhook' | 'guide'>('monitoring');

  // Token management state
  const [currentExamToken, setCurrentExamToken] = useState<string>(getExamToken());
  const [showEditTokenModal, setShowEditTokenModal] = useState<boolean>(false);
  const [newTokenInput, setNewTokenInput] = useState<string>('');
  const [isCopiedToken, setIsCopiedToken] = useState<boolean>(false);

  // Password change modal state
  const [showChangePassModal, setShowChangePassModal] = useState<boolean>(false);
  const [newPassInput, setNewPassInput] = useState<string>('');
  const [confirmPassInput, setConfirmPassInput] = useState<string>('');
  const [passChangeMsg, setPassChangeMsg] = useState<string>('');

  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState<string>(getWebhookUrl());
  const [isCopiedScript, setIsCopiedScript] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string>('');
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isFlushingQueue, setIsFlushingQueue] = useState<boolean>(false);

  // Submissions state
  const [submittedNisns, setSubmittedNisns] = useState<string[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<Record<string, SubmissionPayload>>({});

  const reloadData = () => {
    setSubmittedNisns(getSubmittedNisnList());
    setQueueCount(getOfflineQueue().length);
    setWebhookUrl(getWebhookUrl());
    setCurrentExamToken(getExamToken());

    // Load stored submissions if any
    const map: Record<string, SubmissionPayload> = {};
    const queue = getOfflineQueue();
    queue.forEach(item => {
      map[item.nisn] = item;
    });

    // Also scan local states for in-progress exams
    STUDENTS_DATA.forEach(s => {
      try {
        const stored = localStorage.getItem(`cbt_state_${s.nisn}`);
        if (stored && !map[s.nisn]) {
          const parsed = JSON.parse(stored);
          const scoreRes = calculateScore(parsed.answers || {});
          const violCount = (parsed.violations || []).length;
          map[s.nisn] = {
            submissionId: `ACTIVE-${s.nisn}`,
            timestamp: 'Sedang Berlangsung',
            nisn: s.nisn,
            nipd: s.nipd,
            nama: s.nama,
            rombel: s.rombel,
            jurusan: s.jurusan,
            score: scoreRes.score,
            correctCount: scoreRes.correct,
            totalQuestions: 30,
            timeUsedSeconds: (90 * 60) - (parsed.timeLeft || 0),
            timeUsedFormatted: `${Math.floor(((90 * 60) - (parsed.timeLeft || 0)) / 60)} m`,
            violationsCount: violCount,
            violationsLog: parsed.violations || [],
            deviceInfo: { os: 'Perangkat Siswa', browser: 'Peramban Aktif', screen: 'Aktif', userAgent: '' },
            answers: parsed.answers || {},
            status: violCount >= 3 ? `🚨 ${violCount}x Pelanggaran (Aktif)` : 'Sedang Mengerjakan'
          };
        }
      } catch {}
    });

    setStudentSubmissions(map);
  };

  useEffect(() => {
    reloadData();
    const interval = setInterval(reloadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenInput.trim()) return;
    setExamToken(newTokenInput.trim());
    setCurrentExamToken(getExamToken());
    setShowEditTokenModal(false);
    setNewTokenInput('');
  };

  const handleGenerateRandomToken = () => {
    const randomTok = generateRandomToken();
    setExamToken(randomTok);
    setCurrentExamToken(randomTok);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(currentExamToken);
    setIsCopiedToken(true);
    setTimeout(() => setIsCopiedToken(false), 2000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassInput.trim()) {
      setPassChangeMsg('Kata sandi baru tidak boleh kosong.');
      return;
    }
    if (newPassInput !== confirmPassInput) {
      setPassChangeMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setAdminPassword(newPassInput.trim());
    setPassChangeMsg('✓ Kata sandi Portal Guru berhasil diubah!');
    setTimeout(() => {
      setShowChangePassModal(false);
      setNewPassInput('');
      setConfirmPassInput('');
      setPassChangeMsg('');
    }, 1500);
  };

  const handleSaveWebhook = () => {
    saveWebhookUrl(webhookUrl);
    setTestStatus('URL Webhook berhasil disimpan.');
    setTimeout(() => setTestStatus(''), 3000);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setTestStatus('Harap masukkan URL Webhook terlebih dahulu.');
      return;
    }
    setIsTestingWebhook(true);
    setTestStatus('Mengirim data uji coba ke Google Apps Script...');

    try {
      const dummyPayload: SubmissionPayload = {
        submissionId: `TEST-${Date.now()}`,
        timestamp: new Date().toLocaleString('id-ID'),
        nisn: '0000000000',
        nipd: '00000',
        nama: 'PENGUJIAN KONEKSI WEBHOOK',
        rombel: '12-TEST',
        jurusan: 'Simulasi Sistem',
        score: 100,
        correctCount: 30,
        totalQuestions: 30,
        timeUsedSeconds: 120,
        timeUsedFormatted: '2 menit',
        violationsCount: 0,
        violationsLog: [],
        deviceInfo: {
          os: 'Test OS',
          browser: 'Test Browser',
          screen: '1920x1080',
          userAgent: 'Tester/1.0'
        },
        answers: {},
        status: 'Tes Koneksi Berhasil'
      };

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(dummyPayload)
      });

      setTestStatus('✓ Sukses! Data uji coba berhasil dikirim ke Google Spreadsheet. Silakan periksa Google Sheet Anda.');
    } catch (e: any) {
      setTestStatus(`Gagal mengirim: ${e.message || e}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleFlushQueue = async () => {
    setIsFlushingQueue(true);
    const res = await flushOfflineQueue();
    setQueueCount(res.remaining);
    setIsFlushingQueue(false);
    setTestStatus(`Sinkronisasi selesai: ${res.sent} data terkirim, ${res.remaining} tertunda.`);
    reloadData();
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopiedScript(true);
    setTimeout(() => setIsCopiedScript(false), 2500);
  };

  const handleResetStudent = (student: Student) => {
    const ok = window.confirm(
      `Yakin ingin mereset sesi ujian untuk siswa:\n${student.nama} (${student.rombel})?\n\nTindakan ini menghapus data sesi lokal siswa agar dapat login kembali.`
    );
    if (!ok) return;

    try {
      localStorage.removeItem(`cbt_state_${student.nisn}`);
      const updatedList = getSubmittedNisnList().filter(n => n !== student.nisn);
      localStorage.setItem('cbt_submitted_nisn_list', JSON.stringify(updatedList));
      reloadData();
      if (selectedStudentForDetail?.nisn === student.nisn) {
        setSelectedStudentForDetail(null);
      }
      alert(`Sesi siswa ${student.nama} berhasil direset.`);
    } catch (e) {
      alert('Gagal mereset sesi.');
    }
  };

  // Export CSV of all students with results
  const handleExportCsv = () => {
    let csv = 'No,Nama,Rombel,NISN,NIPD,Jurusan,Status,Nilai,Benar,Waktu Pengerjaan,Pelanggaran\n';
    STUDENTS_DATA.forEach(s => {
      const sub = studentSubmissions[s.nisn];
      const isDone = submittedNisns.includes(s.nisn);
      const status = isDone ? 'Selesai' : sub ? 'Sedang Mengerjakan' : 'Belum Mulai';
      const score = sub ? sub.score : '-';
      const correct = sub ? sub.correctCount : '-';
      const time = sub ? sub.timeUsedFormatted : '-';
      const viol = sub ? sub.violationsCount : 0;

      csv += `"${s.no}","${s.nama}","${s.rombel}","'${s.nisn}","'${s.nipd}","${s.jurusan}","${status}","${score}","${correct}","${time}","${viol}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hasil_CBT_SMKN2_Gorontalo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered students for monitoring list
  const filteredStudents = useMemo(() => {
    return STUDENTS_DATA.filter(s => {
      if (selectedRombelFilter !== 'ALL' && s.rombel !== selectedRombelFilter) return false;

      const isDone = submittedNisns.includes(s.nisn);
      const isProgress = !!studentSubmissions[s.nisn] && !isDone;
      const sub = studentSubmissions[s.nisn];

      if (statusFilter === 'DONE' && !isDone) return false;
      if (statusFilter === 'IN_PROGRESS' && !isProgress) return false;
      if (statusFilter === 'NOT_STARTED' && (isDone || isProgress)) return false;
      if (statusFilter === 'VIOLATION' && (!sub || sub.violationsCount === 0)) return false;
      if (statusFilter === 'VIOLATION_3_PLUS' && (!sub || sub.violationsCount < 3)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.nama.toLowerCase().includes(q) || s.nisn.includes(q) || s.nipd.includes(q);
      }

      return true;
    });
  }, [selectedRombelFilter, statusFilter, searchQuery, submittedNisns, studentSubmissions]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = STUDENTS_DATA.length;
    let completed = 0;
    let inProgress = 0;
    let violations = 0;
    let violations3Plus = 0;

    STUDENTS_DATA.forEach(s => {
      if (submittedNisns.includes(s.nisn)) {
        completed++;
      } else if (studentSubmissions[s.nisn]) {
        inProgress++;
      }
      const sub = studentSubmissions[s.nisn];
      if (sub && sub.violationsCount > 0) {
        violations++;
        if (sub.violationsCount >= 3) {
          violations3Plus++;
        }
      }
    });

    const notStarted = total - completed - inProgress;
    return { total, completed, inProgress, notStarted, violations, violations3Plus };
  }, [submittedNisns, studentSubmissions]);

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1c2430] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#132a4c] text-white shadow-md px-4 sm:px-6 py-3 flex items-center justify-between border-b border-blue-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLogin}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Kembali ke Halaman Peserta"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PORTAL KHUSUS GURU &amp; PENGAWAS</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold">
              Monitoring CBT — SMK Negeri 2 Gorontalo
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChangePassModal(true)}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors border border-white/20 cursor-pointer"
            title="Ganti Kata Sandi Portal"
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Ganti Sandi Portal</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Excel/CSV</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs - Sheets settings are strictly inside portal */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 flex gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`py-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'monitoring'
              ? 'border-[#132a4c] text-[#132a4c]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Monitoring 294 Peserta</span>
        </button>

        <button
          onClick={() => setActiveTab('webhook')}
          className={`py-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'webhook'
              ? 'border-[#132a4c] text-[#132a4c]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pengaturan Spreadsheet &amp; Antrean</span>
          {queueCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {queueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`py-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'guide'
              ? 'border-[#132a4c] text-[#132a4c]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Panduan Apps Script &amp; GitHub</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* TAB 1: MONITORING */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* Active Exam Token Banner */}
            <div className="bg-gradient-to-r from-[#132a4c] to-[#1e3a63] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-300/30">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                    TOKEN UJIAN AKTIF
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-white bg-black/25 px-3 py-0.5 rounded-lg border border-white/20">
                      {currentExamToken}
                    </span>
                    <button
                      onClick={handleCopyToken}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition-all cursor-pointer"
                      title="Salin Token"
                    >
                      {isCopiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-blue-200 mt-1">
                    Bagikan token ini kepada siswa di ruang ujian untuk membuka pengerjaan soal.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setNewTokenInput(currentExamToken);
                    setShowEditTokenModal(true);
                  }}
                  className="flex-1 sm:flex-none text-xs bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 rounded-xl border border-white/20 transition-all cursor-pointer"
                >
                  Ubah Token
                </button>
                <button
                  onClick={handleGenerateRandomToken}
                  className="flex-1 sm:flex-none text-xs bg-amber-400 hover:bg-amber-500 text-[#132a4c] font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Acak Token Baru
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase">Total Peserta</div>
                <div className="text-2xl font-bold text-[#132a4c] mt-1">{stats.total}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">11 Rombel Terdaftar</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-semibold text-emerald-600 uppercase">Selesai Submit</div>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">
                  {Math.round((stats.completed / stats.total) * 100)}% Pengisian
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-semibold text-blue-600 uppercase">Sedang Mengerjakan</div>
                <div className="text-2xl font-bold text-blue-700 mt-1">{stats.inProgress}</div>
                <div className="text-[10px] text-blue-600 mt-0.5">Sesi Aktif</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-semibold text-gray-400 uppercase">Belum Mulai</div>
                <div className="text-2xl font-bold text-gray-600 mt-1">{stats.notStarted}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Menunggu Login</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs bg-red-50/20 col-span-2 sm:col-span-1">
                <div className="text-[11px] font-semibold text-red-600 uppercase">Pelanggaran Terdeteksi</div>
                <div className="text-2xl font-bold text-red-700 mt-1 flex items-baseline gap-1.5">
                  <span>{stats.violations}</span>
                  {stats.violations3Plus > 0 && (
                    <span className="text-xs text-red-600 font-semibold">({stats.violations3Plus} ≥ 3x)</span>
                  )}
                </div>
                <div className="text-[10px] text-red-500 mt-0.5">Soal Tetap Aktif Terbuka</div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Cari Nama, NISN, atau NIPD..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#132a4c]"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 font-medium focus:outline-none"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="DONE">Selesai Submit</option>
                    <option value="IN_PROGRESS">Sedang Mengerjakan</option>
                    <option value="NOT_STARTED">Belum Mulai</option>
                    <option value="VIOLATION">Ada Pelanggaran (&gt; 0)</option>
                    <option value="VIOLATION_3_PLUS">🚨 Melanggar 3x atau Lebih</option>
                  </select>

                  {/* Rombel Filter */}
                  <select
                    value={selectedRombelFilter}
                    onChange={e => setSelectedRombelFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 font-medium focus:outline-none"
                  >
                    <option value="ALL">Semua Rombel (11)</option>
                    {ROMBELS.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.id} ({r.jurusan})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={reloadData}
                    className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3">Nama Siswa</th>
                      <th className="py-3 px-3">Rombel</th>
                      <th className="py-3 px-3">NISN / NIPD</th>
                      <th className="py-3 px-3">Status Ujian</th>
                      <th className="py-3 px-3 text-center">Nilai (Proktor)</th>
                      <th className="py-3 px-3 text-center">Pelanggaran Terdeteksi</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400">
                          Tidak ada data siswa yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const isDone = submittedNisns.includes(student.nisn);
                        const sub = studentSubmissions[student.nisn];
                        const isProgress = !!sub && !isDone;
                        const has3PlusViolations = sub && sub.violationsCount >= 3;

                        return (
                          <tr
                            key={student.nisn}
                            className={`transition-colors ${
                              has3PlusViolations
                                ? 'bg-red-50/80 hover:bg-red-100/70 border-l-4 border-l-red-600'
                                : 'hover:bg-blue-50/40'
                            }`}
                          >
                            <td className="py-3 px-3 text-center font-mono text-gray-400">
                              {student.no}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-gray-900">{student.nama}</div>
                              <div className="text-[10px] text-gray-400">{student.jurusan}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-gray-700">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                                {student.rombel}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-gray-600 text-[11px]">
                              {student.nisn}
                              <span className="text-gray-400 block text-[10px]">NIPD: {student.nipd}</span>
                            </td>
                            <td className="py-3 px-3">
                              {isDone ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Selesai
                                </span>
                              ) : isProgress ? (
                                <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border ${
                                  has3PlusViolations
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  <Clock className="w-3 h-3" />
                                  <span>{has3PlusViolations ? 'Aktif (Melanggar ≥3x)' : 'Mengerjakan'}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400">Belum Mulai</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {sub ? (
                                <span className="font-bold text-sm text-[#132a4c]">
                                  {sub.score}
                                  <span className="text-[10px] text-gray-400 font-normal block">
                                    ({sub.correctCount}/30)
                                  </span>
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {sub && sub.violationsCount > 0 ? (
                                <span
                                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                    sub.violationsCount >= 3
                                      ? 'bg-red-600 text-white animate-pulse shadow-xs'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>
                                    {sub.violationsCount >= 3
                                      ? `🚨 ${sub.violationsCount}x (≥ 3)`
                                      : `${sub.violationsCount}x`}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-mono text-[11px]">0</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedStudentForDetail(student)}
                                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                                  title="Lihat Log Perangkat &amp; Detail"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                {(isDone || isProgress) && (
                                  <button
                                    onClick={() => handleResetStudent(student)}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                    title="Reset Sesi Ujian Siswa Ini"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WEBHOOK CONFIGURATION (Accessible only from Portal Guru) */}
        {activeTab === 'webhook' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Exclusive Access Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                <b>Akses Terproteksi Portal Guru:</b> Pengaturan Webhook Google Spreadsheet, sinkronisasi data antrean, dan kode Apps Script hanya dapat diakses melalui portal ini.
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-[#132a4c] flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Konfigurasi Google Spreadsheet Webhook</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Sinkronisasi langsung hasil ujian dan deteksi kecurangan 300 siswa secara simultan tanpa kendala koneksi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  URL Aplikasi Web Google Apps Script (Web App URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    className="flex-1 p-2.5 border border-gray-300 rounded-xl text-xs font-mono focus:outline-none focus:border-[#132a4c]"
                  />
                  <button
                    onClick={handleSaveWebhook}
                    className="bg-[#132a4c] hover:bg-[#1e3a63] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Simpan URL
                  </button>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  URL ini diperoleh setelah menerapkan (Deploy) Google Apps Script sebagai Web App dengan akses "Anyone".
                </div>
              </div>

              {testStatus && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed font-medium">
                  {testStatus}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  disabled={isTestingWebhook}
                  onClick={handleTestWebhook}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-spin' : ''}`} />
                  <span>Uji Coba Kirim Data Dummy</span>
                </button>

                <button
                  disabled={isFlushingQueue || queueCount === 0}
                  onClick={handleFlushQueue}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors ${
                    queueCount > 0
                      ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFlushingQueue ? 'animate-spin' : ''}`} />
                  <span>Kirim Ulang Antrean ({queueCount} Data Tertunda)</span>
                </button>
              </div>

              {/* Offline Resilience Guarantee Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
                <b>⚡ Ketahanan Koneksi 300 Siswa:</b>
                <p className="mt-1 text-[11px] text-amber-800">
                  Aplikasi ini dirancang dengan antrean lokal (Client-side offline queue &amp; lock service). Jika 300 siswa mengumpulkan secara bersamaan dalam detik yang sama, data langsung diamankan di peramban dan dikirim dengan antrean otomatis sehingga tidak ada data yang terputus atau hilang sekalipun koneksi internet sekolah sempat berfluktuasi.
                </p>
              </div>
            </div>

            {/* Apps Script Code Copy Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#132a4c]">Kode Google Apps Script (Code.gs)</h3>
                  <p className="text-xs text-gray-500">Salin dan tempelkan kode ini ke editor Apps Script Google Sheet Anda.</p>
                </div>

                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1.5 bg-[#132a4c] hover:bg-[#1e3a63] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {isCopiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedScript ? 'Berhasil Disalin!' : 'Salin Seluruh Kode'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: STEP-BY-STEP GUIDE */}
        {activeTab === 'guide' && (
          <div className="max-w-3xl mx-auto space-y-6 text-xs text-gray-700">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#132a4c] border-b pb-2">
                1. Langkah Otomatisasi Google Apps Script
              </h2>
              <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                <li>
                  Buka Google Spreadsheet baru di browser Anda melalui{' '}
                  <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">
                    sheets.new
                  </a>.
                </li>
                <li>
                  Buka menu <b>Ekstensi</b> &gt; <b>Apps Script</b>.
                </li>
                <li>
                  Hapus kode default yang ada di dalam file <code>Code.gs</code>.
                </li>
                <li>
                  Buka tab <b>Koneksi Google Spreadsheet</b> di panel pengawas ini, lalu klik <b>Salin Seluruh Kode</b>.
                </li>
                <li>
                  Tempelkan (Paste) kode tersebut ke dalam <code>Code.gs</code> di Google Apps Script dan klik tombol <b>Simpan (Ikon Disket)</b>.
                </li>
                <li>
                  Klik tombol biru <b>Terapkan (Deploy)</b> di pojok kanan atas &gt; pilih <b>Penerapan baru (New deployment)</b>.
                </li>
                <li>
                  Klik ikon gerigi di sebelah "Pilih jenis" &gt; pilih <b>Aplikasi Web (Web App)</b>.
                </li>
                <li>
                  Atur konfigurasi berikut dengan teliti:
                  <ul className="list-disc pl-5 mt-1 space-y-1 font-semibold text-gray-800">
                    <li>Jalankan sebagai (Execute as): <b>Saya (email Anda)</b></li>
                    <li>Siapa yang memiliki akses (Who has access): <b>Siapa saja (Anyone)</b> — <i>Penting agar siswa dapat mengirim data tanpa perlu login akun Google pribadi.</i></li>
                  </ul>
                </li>
                <li>
                  Klik <b>Terapkan (Deploy)</b> dan berikan otorisasi izin akses Spreadsheet jika diminta Google.
                </li>
                <li>
                  Salin <b>URL Aplikasi Web (Web App URL)</b> yang berakhiran <code>/exec</code>, lalu tempelkan ke form konfigurasi Webhook di tab pengawas ini dan klik <b>Simpan URL</b>.
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#132a4c] border-b pb-2">
                2. Cara Publikasi ke GitHub &amp; Hosting
              </h2>
              <p className="leading-relaxed">
                Aplikasi ini dibangun menggunakan Vite + React + TypeScript murni tanpa backend khusus server sehingga dapat di-hosting secara gratis dengan performa tinggi pada <b>GitHub Pages</b>, <b>Vercel</b>, atau <b>Cloudflare Pages</b>.
              </p>
              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] space-y-1">
                <div># Inisialisasi Git dan Push ke Repository Anda:</div>
                <div className="text-emerald-400">git init</div>
                <div className="text-emerald-400">git add .</div>
                <div className="text-emerald-400">git commit -m "Inisialisasi CBT SMKN 2 Gorontalo"</div>
                <div className="text-emerald-400">git branch -M main</div>
                <div className="text-emerald-400">git remote add origin https://github.com/USERNAME/cbt-smkn2-gorontalo.git</div>
                <div className="text-emerald-400">git push -u origin main</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-[#132a4c]">
                  Log Perangkat &amp; Integritas Peserta
                </h3>
                <div className="text-xs text-gray-500">
                  {selectedStudentForDetail.nama} ({selectedStudentForDetail.rombel}) • NISN: {selectedStudentForDetail.nisn}
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Submissions or Active State */}
            {(() => {
              const sub = studentSubmissions[selectedStudentForDetail.nisn];
              if (!sub) {
                return (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    Siswa belum memulai sesi ujian. Tidak ada data perangkat yang tercatat.
                  </div>
                );
              }

              return (
                <div className="space-y-4 text-xs">
                  {/* Status & Score */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Status Ujian</span>
                      <b className="text-gray-900">{sub.status}</b>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Nilai Akhir (Proktor)</span>
                      <b className="text-[#132a4c] text-sm">{sub.score} / 100</b>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Jawaban Benar</span>
                      <b>{sub.correctCount} dari 30</b>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Waktu Digunakan</span>
                      <b>{sub.timeUsedFormatted}</b>
                    </div>
                  </div>

                  {/* Device Telemetry */}
                  <div className="border border-gray-200 rounded-xl p-3.5 space-y-2">
                    <div className="font-bold text-gray-700 flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-blue-600" />
                      <span>Informasi Perangkat Pengguna (Device Telemetry)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-600">
                      <div>
                        Sistem Operasi: <b className="text-gray-900">{sub.deviceInfo.os}</b>
                      </div>
                      <div>
                        Peramban: <b className="text-gray-900">{sub.deviceInfo.browser}</b>
                      </div>
                      <div>
                        Resolusi Layar: <span className="font-mono">{sub.deviceInfo.screen}</span>
                      </div>
                      <div>
                        Waktu Kirim: <span>{sub.timestamp}</span>
                      </div>
                    </div>
                    {sub.deviceInfo.userAgent && (
                      <div className="text-[10px] font-mono text-gray-400 truncate mt-1">
                        UA: {sub.deviceInfo.userAgent}
                      </div>
                    )}
                  </div>

                  {/* Violations Log */}
                  <div className="border border-gray-200 rounded-xl p-3.5 space-y-2">
                    <div className="font-bold text-gray-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-red-700">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>Riwayat Aktivitas Mencurigakan ({sub.violationsCount} Kejadian)</span>
                      </span>
                      {sub.violationsCount >= 3 && (
                        <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-bold">
                          🚨 Melanggar ≥ 3x (Soal Tidak Dikunci)
                        </span>
                      )}
                    </div>

                    {sub.violationsLog && sub.violationsLog.length > 0 ? (
                      <ul className="space-y-1.5 max-h-40 overflow-y-auto pl-1">
                        {sub.violationsLog.map((v, idx) => (
                          <li
                            key={idx}
                            className="bg-red-50 text-red-800 p-2 rounded-lg text-[11px] flex items-start gap-2 border border-red-100"
                          >
                            <span className="font-mono font-bold text-red-900">[{v.time}]</span>
                            <span>{v.msg}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-emerald-700 bg-emerald-50 p-2.5 rounded-lg text-[11px] font-medium">
                        ✓ Tidak ada aktivitas pelanggaran atau kecurangan yang terdeteksi selama ujian.
                      </div>
                    )}
                  </div>

                  {/* Reset Option */}
                  <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                    <span className="text-[11px] text-gray-500">
                      Butuh memberi kesempatan ulang karena kendala teknis perangkat?
                    </span>
                    <button
                      onClick={() => handleResetStudent(selectedStudentForDetail)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Reset Sesi Siswa Ini
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit Token Modal */}
      {showEditTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-[#132a4c] mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Ubah Token Ujian</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Masukkan token baru yang harus diinput siswa untuk masuk ke lembar soal.
            </p>

            <form onSubmit={handleSaveToken} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  maxLength={12}
                  placeholder="Contoh: TKA2026"
                  value={newTokenInput}
                  onChange={e => setNewTokenInput(e.target.value.toUpperCase())}
                  className="w-full text-center font-mono font-bold text-lg tracking-widest p-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#132a4c] uppercase"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditTokenModal(false)}
                  className="flex-1 py-2 px-3 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newTokenInput.trim()}
                  className="flex-1 py-2 px-3 bg-[#132a4c] hover:bg-[#1e3a63] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Simpan Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal (Teacher Portal Password - Secure) */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-[#132a4c] mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              <span>Ganti Sandi Portal Guru</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Perbarui kata sandi akses ke Panel Pengawas &amp; Pengaturan Spreadsheet.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  placeholder="Ketik sandi baru..."
                  value={newPassInput}
                  onChange={e => setNewPassInput(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#132a4c]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  placeholder="Ulangi sandi baru..."
                  value={confirmPassInput}
                  onChange={e => setConfirmPassInput(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#132a4c]"
                />
              </div>

              {passChangeMsg && (
                <div className={`text-xs p-2 rounded-lg text-center ${
                  passChangeMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}>
                  {passChangeMsg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassModal(false);
                    setPassChangeMsg('');
                  }}
                  className="flex-1 py-2 px-3 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-[#132a4c] hover:bg-[#1e3a63] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Perbarui Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
