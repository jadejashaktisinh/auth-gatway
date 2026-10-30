import "dotenv/config";
import { db } from "../db/db.js";
import { client_routes, clients, proxy_logs } from "../db/schema/schema.js";
import { and, eq, like } from "drizzle-orm/pg-core/expressions";
import jwt from "jsonwebtoken";
import { IncomingMessage, ServerResponse } from "http";
import redisClient from "../config/redis.js";
import type { ProxyRequest, ProxyLog } from "../types/proxy.types.js";
import type { Request, Response, NextFunction } from "express";
import {
  extractCompany,
  extractToken,
  sendErrorResponse,
  normalizeRoute,
  rejectRequest,
} from "../utils/proxy/proxy.utils.js";

export async function ProxyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const expressReq = req as ProxyRequest;
  const token = extractToken(req);
  const extracted = extractCompany(expressReq);

  let route = normalizeRoute(expressReq.params.route);

  if (!route) {
    return await rejectRequest("Route Missing", "Route is required.", res, 401);
  }

  req.headers["route"] = route;
  const row = await checkClientExists(extracted, route);
  if (!row) {
    return sendErrorResponse(
      res,
      {
        error: "Client Not Found",
        message: "The requested client was not found.",
      },
      404,
    );
  }

  let log: ProxyLog = {
    client_id: row.clients.id,
    route: route,
    target_url: "",
    timestamp: new Date().toISOString(),
    method: req.method ?? "",
    status_code: "404",
    response_time: "0",
    error_message: "",
  };

  if (!row.client_routes) {
    return await rejectRequest(
      "Route Not Found",
      "The requested route was not found.",
      res,
      404,
      log,
    );
  }

  // Both exist — safe to use
  const targetUrl = row.client_routes.target_url;
  log.target_url = targetUrl;
  req.headers["targeturl"] = targetUrl;
  req.headers["x-client-id"] = row.clients.id;
  const rateLimitKey = `route:${extracted}:${route}`;

  const requestRate = await rateLimiter(rateLimitKey, res);
  console.log("requestRate => ", requestRate);
  if (!requestRate) {
    return await rejectRequest(
      "Rate Limit Exceeded",
      "Rate Limit Exceeded",
      res,
      429,
      log,
    );
  }

  if (!token || token.trim() === "") {
    return await rejectRequest(
      "Token Missing",
      "Authorization token is required.",
      res,
      401,
      log,
    );
  }
  if (!extracted || extracted.trim() === "") {
    return rejectRequest(
      "Subdomain Missing",
      "Subdomain is required.",
      res,
      401,
      log,
    );
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET ?? "");
    await redisClient.incr(rateLimitKey);
    next();
    // Append the original request URL to the target URL
  } catch (error: any) {
    return rejectRequest(
      "Invalid Token",
      error.message || "The provided token is invalid.",
      res,
      401,
    );
  }
}

async function checkClientExists(companyName: string, route: string) {
  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.companyName, companyName))
    .leftJoin(
      client_routes,
      and(
        eq(client_routes.client_id, clients.id),
        like(client_routes.client_path, `%${route}%`),
      ),
    )
    .limit(1);
  const row = client[0];

  if (!row) {
    return false;
  }
  return row;
}

async function rateLimiter(
  rateLimitKey: string,
  res: ServerResponse<IncomingMessage>,
) {
  const requestRate = await redisClient.get(rateLimitKey);
  if (requestRate && parseInt(requestRate) >= 100) {
    return false;
  }
  if (!requestRate) {
    await redisClient.set(rateLimitKey, "0", {
      EX: 60,
      NX: true,
    });
  }
  return requestRate ?? "0";
}
