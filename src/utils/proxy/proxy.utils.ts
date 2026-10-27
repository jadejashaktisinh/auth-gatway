import { ClientRequest, IncomingMessage, ServerResponse } from "http";
import type { ProxyLog, ProxyRequest } from "../../types/proxy.types.js";
import { insertProxyLog } from "../../models/proxy-log.model.js";

export async function rejectRequest(
  error: string,
  message: string,
  res: ServerResponse<IncomingMessage>,
  statusCode: number,
  log?: ProxyLog,
) {
  sendErrorResponse(
    res,
    {
      error: error,
      message: message,
    },
    statusCode,
  );
  if (log) {
    await insertProxyLog({
      ...log,
      error_message: error,
    });
  }
  return process.env.FALLBACK_URL ?? "";
}

export function sendErrorResponse(
  res: ServerResponse<IncomingMessage>,
  data: { error: string; message: string },
  statusCode: number,
) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(data));
}

export function normalizeRoute(
  route: string | string[] | undefined,
): string | false {
  if (!route) {
    return false;
  }
  if (Array.isArray(route)) {
    route = route[0] ?? "/";
  }

  return route;
}

export function extractCompany(req: ProxyRequest) {
  let { companyname } = req.params;

  if (companyname && !Array.isArray(companyname)) {
    return companyname;
  }

  return req.vhost[0] ?? "";
}

export function extractToken(req: IncomingMessage) {
  const authHeader = req.headers["authorization"];
  return authHeader && authHeader.split(" ")[1];
}
