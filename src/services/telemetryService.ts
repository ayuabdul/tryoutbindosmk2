/**
 * Telemetry and Anti-Cheat System
 * Detects app switches, backgrounding, screenshotting, screen recorders,
 * floating apps, tab changes, and device specs.
 */

export interface TelemetryEvent {
  id: string;
  time: string;
  timestamp: number;
  type: 'info' | 'warn' | 'cheat' | 'answer';
  message: string;
}

export interface DeviceInfo {
  os: string;
  browser: string;
  screen: string;
  isMobile: boolean;
  userAgent: string;
  batteryLevel?: string;
}

export function detectDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent || '';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  if (/android/i.test(ua)) os = 'Android';
  else if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS';
  else if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  if (/chrome|crios/i.test(ua) && !/edge|edg|opr/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const screen = `${window.screen.width}x${window.screen.height} (dpr ${window.devicePixelRatio || 1})`;

  return {
    os,
    browser,
    screen,
    isMobile,
    userAgent: ua
  };
}

export class AntiCheatController {
  private violations: Array<{ time: string; msg: string }> = [];
  private eventLogs: TelemetryEvent[] = [];
  private onViolationCallback?: (violation: { time: string; msg: string; count: number }) => void;
  private onEventCallback?: (event: TelemetryEvent) => void;
  private maxViolations: number = 4;
  private isExamActive: boolean = false;
  private lastBlurTimestamp: number = 0;

  constructor(maxViolations = 4) {
    this.maxViolations = maxViolations;
  }

  public startMonitoring(
    onViolation: (v: { time: string; msg: string; count: number }) => void,
    onEvent?: (event: TelemetryEvent) => void
  ) {
    this.isExamActive = true;
    this.onViolationCallback = onViolation;
    this.onEventCallback = onEvent;

    this.logEvent('info', 'Ujian dimulai. Pengawasan anti-kecurangan aktif.');

    // 1. Visibility change (tab switch, minimize, lock screen)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // 2. Window blur (floating apps, split screen, opening another program, notification tray)
    window.addEventListener('blur', this.handleWindowBlur);

    // 3. Fullscreen change
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);

    // 4. Block context menu
    document.addEventListener('contextmenu', this.handleContextMenu);

    // 5. Block copy / cut / paste
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('cut', this.handleCut);
    document.addEventListener('paste', this.handlePaste);

    // 6. Block shortcut keys (Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I, etc.)
    document.addEventListener('keydown', this.handleKeyDown);

    // 7. Prevent accidental back/refresh
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  public stopMonitoring() {
    this.isExamActive = false;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('cut', this.handleCut);
    document.removeEventListener('paste', this.handlePaste);
    document.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  public recordViolation(reason: string) {
    if (!this.isExamActive) return;
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const violation = { time: timeStr, msg: reason };
    this.violations.push(violation);
    this.logEvent('cheat', `[PELANGGARAN #${this.violations.length}] ${reason}`);
    this.onViolationCallback?.({
      time: timeStr,
      msg: reason,
      count: this.violations.length
    });
  }

  public logEvent(type: 'info' | 'warn' | 'cheat' | 'answer', message: string) {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const ev: TelemetryEvent = {
      id: Math.random().toString(36).substring(2, 9),
      time: timeStr,
      timestamp: Date.now(),
      type,
      message
    };
    this.eventLogs.push(ev);
    this.onEventCallback?.(ev);
  }

  public getViolations() {
    return [...this.violations];
  }

  public getEventLogs() {
    return [...this.eventLogs];
  }

  public isLimitExceeded(): boolean {
    return this.violations.length >= this.maxViolations;
  }

  // Event Handlers
  private handleVisibilityChange = () => {
    if (!this.isExamActive) return;
    if (document.hidden) {
      this.recordViolation('Peserta berpindah tab atau meminimalkan browser.');
    } else {
      this.logEvent('info', 'Peserta kembali ke tab ujian.');
    }
  };

  private handleWindowBlur = () => {
    if (!this.isExamActive) return;
    // Throttle duplicate blur events triggered alongside visibilitychange
    const now = Date.now();
    if (now - this.lastBlurTimestamp < 1500) return;
    this.lastBlurTimestamp = now;

    this.recordViolation('Layar ujian kehilangan fokus (indikasi membuka aplikasi lain / split-screen / floating overlay).');
  };

  private handleFullscreenChange = () => {
    if (!this.isExamActive) return;
    if (!document.fullscreenElement) {
      this.recordViolation('Peserta keluar dari mode Layar Penuh (Fullscreen).');
    }
  };

  private handleContextMenu = (e: MouseEvent) => {
    if (!this.isExamActive) return;
    e.preventDefault();
  };

  private handleCopy = (e: ClipboardEvent) => {
    if (!this.isExamActive) return;
    e.preventDefault();
    this.recordViolation('Percobaan menyalin (copy) naskah soal atau teks.');
  };

  private handleCut = (e: ClipboardEvent) => {
    if (!this.isExamActive) return;
    e.preventDefault();
  };

  private handlePaste = (e: ClipboardEvent) => {
    if (!this.isExamActive) return;
    e.preventDefault();
    this.recordViolation('Percobaan menempelkan (paste) teks ke dalam aplikasi.');
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isExamActive) return;
    const k = e.key.toLowerCase();

    // DevTools: F12
    if (e.key === 'F12') {
      e.preventDefault();
      this.recordViolation('Percobaan membuka Developer Tools (F12).');
      return;
    }

    // Ctrl+Shift+I / J / C (DevTools)
    if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(k)) {
      e.preventDefault();
      this.recordViolation('Percobaan membuka Developer Tools / Inspect Element.');
      return;
    }

    // Ctrl + C, V, U, P, S
    if (e.ctrlKey && ['c', 'v', 'u', 'p', 's'].includes(k)) {
      e.preventDefault();
      this.recordViolation(`Percobaan pintasan keyboard terlarang (Ctrl+${k.toUpperCase()}).`);
      return;
    }

    // Alt + Tab detection attempt
    if (e.altKey && e.key === 'Tab') {
      this.recordViolation('Percobaan beralih jendela aplikasi (Alt+Tab).');
    }
  };

  private handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!this.isExamActive) return;
    e.preventDefault();
    e.returnValue = '';
  };
}
