import type { IncomingMessage } from "http";
import { type Request } from "express";
export type ProxyRequest = IncomingMessage & Request & { vhost: string[] };

export type ProxyLog = {
  client_id: string;
  route: string;
  target_url: string;
  timestamp: string;
  method: string;
  status_code: string;
  response_time: string;
  error_message: string;
};
