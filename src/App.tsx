/**
 * CBT Try Out TKA Bahasa Indonesia — SMK Negeri 2 Gorontalo
 * High-concurrency client with real-time Google Spreadsheet sync,
 * strict anti-cheat, Rombel student validation, and invigilator monitoring.
 */

import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ExamScreen } from './components/ExamScreen';
import { ResultScreen } from './components/ResultScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { SubmissionPayload } from './services/sheetService';
import { validateAdminPassword } from './services/tokenService';
import { Lock, X } from 'lucide-react';

type Screen = 'login' | 'exam' | 'result' | 'admin';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [activeStudent, setActiveStudent] = useState<{
    nama: string;
    nomor: string;
    rombel: string;
    jurusan: string;
    nipd: string;
    nisn: string;
    jk: 'L' | 'P';
  } | null>(null);

  const [activeSubmission, setActiveSubmission] = useState<SubmissionPayload | null>(null);

  // Admin Password modal state
  const [showAdminPinModal, setShowAdminPinModal] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Check if an ongoing exam session was interrupted by page reload
  useEffect(() => {
    try {
      const activeNisn = sessionStorage.getItem('cbt_active_session_nisn');
      if (activeNisn) {
        const studentRaw = sessionStorage.getItem('cbt_active_session_student');
        if (studentRaw) {
          setActiveStudent(JSON.parse(studentRaw));
          setScreen('exam');
        }
      }
    } catch (e) {
      console.warn('Session restoration failed', e);
    }
  }, []);

  const handleStartExam = (student: {
    nama: string;
    nomor: string;
    rombel: string;
    jurusan: string;
    nipd: string;
    nisn: string;
    jk: 'L' | 'P';
  }) => {
    setActiveStudent(student);
    try {
      sessionStorage.setItem('cbt_active_session_nisn', student.nisn);
      sessionStorage.setItem('cbt_active_session_student', JSON.stringify(student));
    } catch {}
    setScreen('exam');
  };

  const handleFinishExam = (submission: SubmissionPayload) => {
    setActiveSubmission(submission);
    try {
      sessionStorage.removeItem('cbt_active_session_nisn');
      sessionStorage.removeItem('cbt_active_session_student');
    } catch {}
    setScreen('result');
  };

  const handleLogout = () => {
    setActiveStudent(null);
    setActiveSubmission(null);
    setScreen('login');
  };

  const handleOpenAdminPinModal = () => {
    setAdminPinInput('');
    setPinError('');
    setShowAdminPinModal(true);
  };

  const handleVerifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAdminPassword(adminPinInput)) {
      setShowAdminPinModal(false);
      setScreen('admin');
    } else {
      setPinError('Kata sandi salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#1c2430]">
      {screen === 'login' && (
        <LoginScreen
          onStartExam={handleStartExam}
          onOpenAdmin={handleOpenAdminPinModal}
        />
      )}

      {screen === 'exam' && activeStudent && (
        <ExamScreen
          student={activeStudent}
          onFinishExam={handleFinishExam}
        />
      )}

      {screen === 'result' && activeSubmission && (
        <ResultScreen
          submission={activeSubmission}
          onLogout={handleLogout}
        />
      )}

      {screen === 'admin' && (
        <AdminDashboard
          onBackToLogin={() => setScreen('login')}
        />
      )}

      {/* Admin Password Authentication Modal - Never displays or exposes the password */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-[#132a4c]">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#132a4c]">Portal Guru &amp; Pengawas</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminPinModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyAdminPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Masukkan Kata Sandi
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="••••••••"
                  value={adminPinInput}
                  onChange={e => {
                    setAdminPinInput(e.target.value);
                    setPinError('');
                  }}
                  className="w-full p-2.5 text-center text-base tracking-widest border border-gray-300 rounded-xl focus:outline-none focus:border-[#132a4c]"
                />
              </div>

              {pinError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg text-center border border-red-200">
                  {pinError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPinModal(false)}
                  className="flex-1 py-2 px-3 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-[#132a4c] hover:bg-[#1e3a63] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Masuk Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
