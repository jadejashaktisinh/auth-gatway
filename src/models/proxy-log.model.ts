import { db } from "../db/db.js";
import { proxy_logs } from "../db/schema/schema.js";

type ProxyLogData = {
  client_id: string;
  method: string;
  route: string;
  target_url: string;
  timestamp: string;
  status_code: string;
  response_time: string;
  error_message?: string | null;
};

export async function insertProxyLog(
  proxyLogData: ProxyLogData,
): Promise<boolean> {
  const log = await db.insert(proxy_logs).values(proxyLogData).returning();

  return !!log;
}
