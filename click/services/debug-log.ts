export type LogEntry = {
  id: number;
  time: string;
  text: string;
};

let entries: LogEntry[] = [];
let counter = 0;
const listeners = new Set<(e: LogEntry[]) => void>();

function now(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function stringify(data: unknown): string {
  try {
    return typeof data === 'string' ? data : JSON.stringify(data);
  } catch {
    return String(data);
  }
}

/**
 * 화면 디버그 오버레이 + 콘솔에 동시에 로그를 남긴다.
 * Expo Go에서 console.log가 터미널에 안 떠도 화면에서 확인할 수 있다.
 */
export function devLog(message: string, data?: unknown): void {
  const text = data === undefined ? message : `${message} ${stringify(data)}`;
  console.log(text); // 터미널/디버거에도 전달 (보이면 보너스)
  counter += 1;
  entries = [...entries, { id: counter, time: now(), text }].slice(-200);
  listeners.forEach((l) => l(entries));
}

/** 로그 변경을 구독한다. 등록 즉시 현재 로그로 한 번 호출된다. */
export function subscribeLogs(cb: (e: LogEntry[]) => void): () => void {
  listeners.add(cb);
  cb(entries);
  return () => {
    listeners.delete(cb);
  };
}

export function clearLogs(): void {
  entries = [];
  listeners.forEach((l) => l(entries));
}
