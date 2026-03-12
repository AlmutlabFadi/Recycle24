export function nowMs() {
  return performance.now();
}

export function elapsedMs(start: number) {
  return Math.round(performance.now() - start);
}

export function logPerf(label: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ type: "perf", label, ...data }));
}
