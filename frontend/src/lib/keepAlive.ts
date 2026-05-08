const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function startKeepAlive() {
  // Ping immediately on load, then every 10 min
  const ping = () => fetch(`${BACKEND_URL}/health`).catch(() => {});
  ping();
  setInterval(ping, INTERVAL_MS);
}