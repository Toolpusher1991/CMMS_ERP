/**
 * H&P DrillSense -- API Client
 * Dev: Vite proxy /drillsense-api -> http://localhost:8001/api
 * Prod: VITE_DRILLSENSE_API_URL = https://drillsense-relay.onrender.com/api
 */
import axios from "axios";
import type { MudPump, Drawworks, DrillSenseAlert, Esp32Device } from "@/types/drillsense";

/** Ob DrillSense aktiv ist (lokal immer, Render nur wenn URL gesetzt) */
export const DRILLSENSE_ENABLED: boolean =
  import.meta.env.DEV || !!import.meta.env.VITE_DRILLSENSE_API_URL;

const baseURL = import.meta.env.VITE_DRILLSENSE_API_URL
  ? `${import.meta.env.VITE_DRILLSENSE_API_URL}/v1`
  : "/drillsense-api/v1";

const headers: Record<string, string> = {};
if (import.meta.env.VITE_DRILLSENSE_API_KEY) {
  headers["X-API-Key"] = import.meta.env.VITE_DRILLSENSE_API_KEY;
}

const http = axios.create({ baseURL, headers, timeout: 8000 });

http.interceptors.response.use(undefined, (err) => {
  const st = err.response?.status;
  const url = err.config?.url ?? "?";
  if (!st) console.error(`[DrillSense] NETZWERKFEHLER ${url} -- Relay/Pi erreichbar?`);
  else if (st === 403) console.error(`[DrillSense] 403 ${url} -- API-Key pruefen`);
  else console.warn(`[DrillSense] ${st} ${url}`);
  return Promise.reject(err);
});

export const drillsenseApi = {
  getPumps: (): Promise<MudPump[]> =>
    http.get("/pumps/").then((r) => r.data),

  getDrawworks: (): Promise<Drawworks> =>
    http.get("/drawworks/").then((r) => r.data),

  getAlerts: (): Promise<DrillSenseAlert[]> =>
    http.get("/alerts/").then((r) => r.data),

  getEsp32Devices: (): Promise<Esp32Device[]> =>
    http.get("/esp32/").then((r) => r.data),
};
