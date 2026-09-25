import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PASSAGES, QUESTIONS, Question, PgQuestion, BsQuestion, McmaQuestion, isQuestionAnswered, calculateScore } from '../data/examData';
import { AntiCheatController, detectDeviceInfo } from '../services/telemetryService';
import { SubmissionPayload, sendToGoogleSpreadsheet } from '../services/sheetService';
import { AlertCircle, Clock, Check, ChevronLeft, ChevronRight, Menu, X, ShieldAlert, LogOut, CheckCircle } from 'lucide-react';

interface ExamScreenProps {
  student: {
    nama: string;
    nomor: string;
    rombel: string;
    jurusan: string;
    nipd: string;
    nisn: string;
    jk: 'L' | 'P';
  };
  onFinishExam: (submission: SubmissionPayload) => void;
}

const DURATION_SECONDS = 90 * 60; // 90 minutes

export const ExamScreen: React.FC<ExamScreenProps> = ({ student, onFinishExam }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(DURATION_SECONDS);
  const [violations, setViolations] = useState<Array<{ time: string; msg: string }>>([]);
  const [activeViolationModal, setActiveViolationModal] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isConfirmFinishOpen, setIsConfirmFinishOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const antiCheatRef = useRef<AntiCheatController | null>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const hasSubmittedRef = useRef<boolean>(false);

  // Storage key for active state restoration
  const storageKey = `cbt_state_${student.nisn}`;

  // Restore saved state if page reloads or connection hiccups occur
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.timeLeft && parsed.timeLeft > 0) setTimeLeft(parsed.timeLeft);
        if (parsed.currentIndex !== undefined) setCurrentIndex(parsed.currentIndex);
        if (parsed.violations) setViolations(parsed.violations);
      }
    } catch (e) {
      console.warn('Could not restore cached answers', e);
    }
  }, [storageKey]);

  // Autosave to localStorage on any state change
  useEffect(() => {
    if (hasSubmittedRef.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        answers,
        timeLeft,
        currentIndex,
        violations
      }));
    } catch (e) {
      console.warn('Could not persist answers to localStorage', e);
    }
  }, [answers, timeLeft, currentIndex, violations, storageKey]);

// Anti-cheat setup
  useEffect(() => {
    const controller = new AntiCheatController(999);
    antiCheatRef.current = controller;

    controller.startMonitoring(
      (v) => {
        setViolations(prev => {
          const updated = [...prev, { time: v.time, msg: v.msg }];
          // Immediately sync to active storage for real-time monitoring dashboard
          try {
            const currentStorage = localStorage.getItem(storageKey);
            const parsed = currentStorage ? JSON.parse(currentStorage) : {};
            localStorage.setItem(storageKey, JSON.stringify({
              ...parsed,
              violations: updated,
              lastViolation: { time: v.time, msg: v.msg },
              lastActive: Date.now()
            }));
          } catch {}
          return updated;
        });
        setActiveViolationModal(v.msg);
      },
      (ev) => {
        // Event logged
      }
    );

    // Countdown Timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTriggerFinish('Waktu Ujian Habis (90 Menit).', false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      controller.stopMonitoring();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const currentQuestion = QUESTIONS[currentIndex];
  const currentPassage = PASSAGES[currentQuestion.p];

  // Check if passage changed compared to previous question
  const isPassageChanged = useMemo(() => {
    if (currentIndex === 0) return true;
    return QUESTIONS[currentIndex - 1].p !== currentQuestion.p;
  }, [currentIndex, currentQuestion]);

  const answeredCount = useMemo(() => {
    return QUESTIONS.filter(q => isQuestionAnswered(q, answers[q.id])).length;
  }, [answers]);

  const formatTimer = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Answer handlers
  const handleSelectPg = (key: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: key }));
  };

  const handleToggleMcma = (key: string) => {
    const currentList: string[] = answers[currentQuestion.id] || [];
    let updated: string[];
    if (currentList.includes(key)) {
      updated = currentList.filter(k => k !== key);
    } else {
      updated = [...currentList, key];
    }
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: updated }));
  };

  const handleSelectBs = (rowKey: string, label: string) => {
    const currentMap: Record<string, string> = answers[currentQuestion.id] || {};
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentMap,
        [rowKey]: label
      }
    }));
  };

  const handleNext = () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpTo = (index: number) => {
    setCurrentIndex(index);
    setIsMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final submission
  const handleTriggerFinish = async (reason: string, forced: boolean) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);
    if (antiCheatRef.current) antiCheatRef.current.stopMonitoring();

    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (e) {}
    }

    const timeUsed = DURATION_SECONDS - timeLeft;
    const timeUsedFormatted = `${Math.floor(timeUsed / 60)} menit ${timeUsed % 60} detik`;
    const scoreResult = calculateScore(answers);
    const deviceInfo = detectDeviceInfo();

    const submissionPayload: SubmissionPayload = {
      submissionId: `SMK2-${student.rombel}-${student.nisn.slice(-4)}-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      nisn: student.nisn,
      nipd: student.nipd,
      nama: student.nama,
      rombel: student.rombel,
      jurusan: student.jurusan,
      score: scoreResult.score,
      correctCount: scoreResult.correct,
      totalQuestions: QUESTIONS.length,
      timeUsedSeconds: timeUsed,
      timeUsedFormatted,
      violationsCount: violations.length,
      violationsLog: violations,
      deviceInfo: {
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        screen: deviceInfo.screen,
        userAgent: deviceInfo.userAgent
      },
      answers,
      status: forced ? `Dihentikan (${reason})` : 'Selesai Dikumpulkan'
    };

    // Clean active storage
    try {
      localStorage.removeItem(storageKey);
    } catch {}

    // Send to Google Spreadsheet asynchronously (queuing ensures it's never lost)
    await sendToGoogleSpreadsheet(submissionPayload);

    onFinishExam(submissionPayload);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1c2430] flex flex-col font-sans pb-24 md:pb-8 select-none">
      {/* Top Sticky Bar */}
      <header className="sticky top-0 z-30 bg-[#132a4c] text-white shadow-md px-3 sm:px-6 py-2.5 flex items-center justify-between border-b border-blue-900/40">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="md:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0"
            title="Daftar Soal"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="truncate">
            <div className="text-xs sm:text-sm font-bold truncate text-white leading-tight">
              {student.nama}
            </div>
            <div className="text-[11px] text-blue-200 truncate">
              {student.rombel} • NISN: {student.nisn}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Violation Badge */}
          {violations.length > 0 && (
            <div className={`flex items-center gap-1.5 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs ${
              violations.length >= 3 ? 'bg-amber-600 animate-pulse' : 'bg-red-600'
            }`}>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>
                {violations.length >= 3
                  ? `⚠️ ${violations.length}x Pelanggaran`
                  : `Pelanggaran: ${violations.length}x`}
              </span>
            </div>
          )}

          {/* Countdown Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-bold text-sm sm:text-base tracking-wider ${
            timeLeft <= 300 ? 'bg-red-600 text-white animate-pulse' : 'bg-white/15 text-white'
          }`}>
            <Clock className="w-4 h-4 opacity-80" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          {/* Finish Button on Desktop */}
          <button
            onClick={() => setIsConfirmFinishOpen(true)}
            className="hidden md:flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Kumpulkan</span>
          </button>
        </div>
      </header>

      {/* Main Exam Layout */}
      <div className="max-w-6xl w-full mx-auto flex-1 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 p-3 sm:p-6">
        {/* Desktop Side Navigation Panel */}
        <aside className="hidden md:block bg-white rounded-xl border border-gray-200 p-4 sticky top-16 self-start max-h-[calc(100vh-5rem)] overflow-y-auto shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center justify-between">
            <span>Navigasi Soal</span>
            <span className="text-[#132a4c] font-mono">{answeredCount}/30</span>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {QUESTIONS.map((q, idx) => {
              const answered = isQuestionAnswered(q, answers[q.id]);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpTo(idx)}
                  className={`aspect-square rounded-lg font-semibold text-xs border transition-all flex items-center justify-center relative ${
                    isCurrent
                      ? 'border-[#132a4c] bg-blue-50 text-[#132a4c] font-bold ring-2 ring-blue-600/30'
                      : answered
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {q.id}
                  {answered && (
                    <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-gray-500 space-y-1 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
              <span>Sudah dijawab ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-white border border-gray-300 inline-block" />
              <span>Belum dijawab ({30 - answeredCount})</span>
            </div>
          </div>

          <button
            onClick={() => setIsConfirmFinishOpen(true)}
            className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition-colors"
          >
            Selesai &amp; Kumpulkan
          </button>
        </aside>

        {/* Question & Passage Content */}
        <main className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Passage Box (shown whenever passage changes or on mobile easily readable) */}
            {isPassageChanged && currentPassage && (
              <div className="bg-[#fbfaf5] border border-[#ece7d4] border-l-4 border-l-amber-600 rounded-lg p-4 sm:p-5 mb-6 text-gray-800 text-sm leading-relaxed">
                <h2 className="font-serif font-bold text-base sm:text-lg text-[#132a4c] mb-2">
                  {currentPassage.title}
                </h2>
                <div className="space-y-2.5 text-xs sm:text-sm text-gray-700 text-justify">
                  {currentPassage.text.map((paragraph, pIdx) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
                </div>
                <div className="text-[11px] text-gray-500 italic mt-3 pt-2 border-t border-[#ece7d4]">
                  {currentPassage.src}
                </div>
              </div>
            )}

            {/* Question Header Badge */}
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 bg-[#132a4c] text-white text-xs font-bold px-3 py-1 rounded-full">
                <span>Soal {currentQuestion.id} dari {QUESTIONS.length}</span>
                <span className="opacity-60">•</span>
                <span className="uppercase text-[10px] tracking-wider text-amber-300 font-mono">
                  {currentQuestion.type === 'pg'
                    ? 'Pilihan Ganda'
                    : currentQuestion.type === 'mcma'
                    ? 'Pilihan Ganda Kompleks'
                    : 'Tabel Evaluasi'}
                </span>
              </div>

              {isQuestionAnswered(currentQuestion, answers[currentQuestion.id]) ? (
                <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Sudah Terjawab
                </span>
              ) : (
                <span className="text-amber-700 text-xs">Belum Dijawab</span>
              )}
            </div>

            {/* Question Text */}
            <div
              className="text-sm sm:text-base font-normal leading-relaxed text-gray-900 mb-6"
              dangerouslySetInnerHTML={{ __html: currentQuestion.text }}
            />

            {/* Question Answer Interface */}
            {/* TYPE: Pilihan Ganda (pg) */}
            {currentQuestion.type === 'pg' && (
              <div className="space-y-2.5">
                {(currentQuestion as PgQuestion).opts.map(([optKey, optText]) => {
                  const isChecked = answers[currentQuestion.id] === optKey;
                  return (
                    <label
                      key={optKey}
                      className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#1e3a63] bg-blue-50/80 font-medium text-[#132a4c] shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60 text-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${currentQuestion.id}`}
                        value={optKey}
                        checked={isChecked}
                        onChange={() => handleSelectPg(optKey)}
                        className="mt-0.5 w-4 h-4 text-[#132a4c] border-gray-300 focus:ring-[#132a4c]"
                      />
                      <div className="flex-1">
                        <span className="font-bold mr-1.5 text-[#132a4c]">{optKey}.</span>
                        <span dangerouslySetInnerHTML={{ __html: optText }} />
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* TYPE: Pilihan Ganda Kompleks (mcma) */}
            {currentQuestion.type === 'mcma' && (
              <div className="space-y-2.5">
                {(currentQuestion as McmaQuestion).opts.map(([optKey, optText]) => {
                  const currentSelected: string[] = answers[currentQuestion.id] || [];
                  const isChecked = currentSelected.includes(optKey);
                  return (
                    <label
                      key={optKey}
                      className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#1e3a63] bg-blue-50/80 font-medium text-[#132a4c] shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60 text-gray-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMcma(optKey)}
                        className="mt-0.5 w-4 h-4 rounded text-[#132a4c] border-gray-300 focus:ring-[#132a4c]"
                      />
                      <div className="flex-1">
                        <span className="font-bold mr-1.5 text-[#132a4c]">{optKey}.</span>
                        <span dangerouslySetInnerHTML={{ __html: optText }} />
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* TYPE: Benar / Salah Table (bs) */}
            {currentQuestion.type === 'bs' && (
              <div className="overflow-x-auto -mx-2 sm:mx-0 border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-gray-100 text-gray-700 uppercase text-[11px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Pernyataan</th>
                      <th className="py-2.5 px-2 w-20 text-center text-emerald-800">
                        {(currentQuestion as BsQuestion).labels[0]}
                      </th>
                      <th className="py-2.5 px-2 w-20 text-center text-red-800">
                        {(currentQuestion as BsQuestion).labels[1]}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(currentQuestion as BsQuestion).rows.map(([rowKey, rowText]) => {
                      const selectedVal = (answers[currentQuestion.id] || {})[rowKey];
                      const label0 = (currentQuestion as BsQuestion).labels[0];
                      const label1 = (currentQuestion as BsQuestion).labels[1];
                      return (
                        <tr key={rowKey} className="hover:bg-gray-50/80">
                          <td className="py-3 px-3 font-bold text-center text-gray-500">{rowKey}</td>
                          <td className="py-3 px-3 leading-relaxed text-gray-800">{rowText}</td>
                          <td className="py-3 px-2 text-center bg-emerald-50/30">
                            <input
                              type="radio"
                              name={`bs_${currentQuestion.id}_${rowKey}`}
                              value={label0}
                              checked={selectedVal === label0}
                              onChange={() => handleSelectBs(rowKey, label0)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-2 text-center bg-red-50/30">
                            <input
                              type="radio"
                              name={`bs_${currentQuestion.id}_${rowKey}`}
                              value={label1}
                              checked={selectedVal === label1}
                              onChange={() => handleSelectBs(rowKey, label1)}
                              className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Desktop Nav Controls inside question container */}
          <div className="flex items-center justify-between gap-3 pt-8 mt-6 border-t border-gray-100">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                currentIndex === 0
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === QUESTIONS.length - 1}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentIndex === QUESTIONS.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#132a4c] hover:bg-[#1e3a63] text-white cursor-pointer shadow-xs'
              }`}
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Fixed Action Bar (Requirement 4: Sangat nyaman di HP) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-3 py-2.5 flex items-center justify-between shadow-lg">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex items-center justify-center p-2 rounded-lg border text-xs font-semibold ${
            currentIndex === 0 ? 'border-gray-200 text-gray-300' : 'border-gray-300 text-gray-700 active:bg-gray-100'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200"
        >
          <Menu className="w-4 h-4" />
          <span>Soal {currentIndex + 1}/30</span>
          <span className="w-2 h-2 rounded-full bg-blue-600 ml-1" />
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === QUESTIONS.length - 1}
          className={`flex items-center justify-center p-2 rounded-lg text-white text-xs font-bold ${
            currentIndex === QUESTIONS.length - 1 ? 'bg-gray-300 text-gray-500' : 'bg-[#132a4c] active:bg-[#1e3a63]'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsConfirmFinishOpen(true)}
          className="bg-red-600 text-white font-bold text-xs px-3 py-2 rounded-lg shadow-xs"
        >
          Selesai
        </button>
      </div>

      {/* Mobile Drawer Navigation Modal */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end md:hidden">
          <div className="bg-white rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div>
                <h3 className="font-bold text-sm text-[#132a4c]">Daftar Navigasi Soal</h3>
                <p className="text-[11px] text-gray-500">Terjawab: {answeredCount} dari 30 soal</p>
              </div>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2 mb-4">
              {QUESTIONS.map((q, idx) => {
                const answered = isQuestionAnswered(q, answers[q.id]);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpTo(idx)}
                    className={`aspect-square rounded-lg font-semibold text-xs border flex items-center justify-center relative ${
                      isCurrent
                        ? 'border-[#132a4c] bg-blue-50 text-[#132a4c] font-bold ring-2 ring-blue-500'
                        : answered
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    {q.id}
                    {answered && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setIsMobileNavOpen(false);
                setIsConfirmFinishOpen(true);
              }}
              className="w-full bg-red-600 text-white font-bold text-xs py-3 rounded-xl shadow-xs"
            >
              Kumpulkan Ujian Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Violation Alert Modal (Non-locking: questions are never locked, student can continue) */}
      {activeViolationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl animate-shake">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              violations.length >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold ${violations.length >= 3 ? 'text-amber-800' : 'text-red-600'}`}>
              Pelanggaran Terdeteksi! (Ke-{violations.length})
            </h3>
            <p className="text-xs text-gray-700 mt-2 mb-4 leading-relaxed">
              {activeViolationModal}
              <br /><br />
              <span className="font-semibold text-gray-900 bg-amber-50 p-2 rounded-lg inline-block border border-amber-200 text-left">
                📌 <b>Pemberitahuan Sistem:</b> Soal ujian <b>tidak terkunci</b> sehingga Anda tetap dapat melanjutkan menjawab soal. Namun, seluruh riwayat {violations.length} pelanggaran ini telah terdeteksi langsung secara real-time pada Dashboard Pengawas.
              </span>
            </p>
            <button
              onClick={async () => {
                setActiveViolationModal(null);
                if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                  try {
                    await document.documentElement.requestFullscreen();
                  } catch {}
                }
              }}
              className="w-full py-2.5 bg-[#132a4c] hover:bg-[#1e3a63] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
            >
              Saya Mengerti &amp; Lanjutkan Mengerjakan Soal
            </button>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {isConfirmFinishOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-[#132a4c] flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#132a4c]">Konfirmasi Pengumpulan Ujian</h3>
            <p className="text-xs text-gray-600 mt-2 mb-4 leading-relaxed">
              Anda telah menjawab <b>{answeredCount}</b> dari <b>{QUESTIONS.length}</b> soal.
              {answeredCount < QUESTIONS.length && (
                <span className="block mt-2 font-semibold text-amber-600">
                  Masih terdapat {QUESTIONS.length - answeredCount} soal yang belum Anda jawab!
                </span>
              )}
              <br />
              Setelah mengumpulkan, jawaban akan langsung tersimpan di Google Spreadsheet dan Anda tidak dapat mengubah jawaban lagi.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmFinishOpen(false)}
                className="flex-1 py-2.5 px-3 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleTriggerFinish('Dikumpulkan secara normal oleh siswa.', false)}
                className="flex-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                {isSubmitting ? 'Menyimpan...' : 'Ya, Kumpulkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
