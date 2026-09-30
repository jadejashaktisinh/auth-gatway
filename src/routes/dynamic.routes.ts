import "dotenv/config";
import { createProxyMiddleware } from "http-proxy-middleware";
import { type Request } from "express";
import { db } from "../db/db.js";
import { client_routes, clients, proxy_logs } from "../db/schema/schema.js";
import { and, eq, like } from "drizzle-orm/pg-core/expressions";
import jwt from "jsonwebtoken";
import { ClientRequest, IncomingMessage, ServerResponse } from "http";
import redisClient from "../config/redis.js";
import type { Client } from "pg";
import { insertProxyLog } from "../models/proxy-log.model.js";

const dynamicProxy = createProxyMiddleware({
  target: "http://localhost:default-fallback", // Fallback target
  changeOrigin: true,
  router: async (req, res) => {
    const expressReq = req as unknown as Request & { vhost: string[] };
    const subdomain = expressReq.vhost[0] ?? "/inventory";
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let { route } = expressReq.params;


    if (!route) {
      handleServerResponseType(res as ServerResponse<IncomingMessage>, {
        error: 'Route Missing',
        message: 'Route is required.'
      });
      return process.env.FALLBACK_URL ?? "";
    }

    if (Array.isArray(route)) {
      route = route[0] ?? "/";
    }
    req.headers['route'] = route;

    const client = await db.select().from(clients).where(eq(clients.companyName, subdomain)).leftJoin(client_routes, and(eq(client_routes.client_id, clients.id), like(client_routes.client_path, `%${route}%`))).limit(1);
    const row = client[0];

    if (!row) {
      handleServerResponseType(res as ServerResponse<IncomingMessage>, {
        error: 'Client Not Found',
        message: 'The requested client was not found.'
      });
      return process.env.FALLBACK_URL ?? "";
    }
    let log = {
      client_id: row.clients.id,
      route: route,
      target_url: "",
      timestamp: new Date().toISOString(),
      method: req.method ?? "",
      status_code: "404",
      response_time: "0",
      error_message: ""
    }

    if (!row.client_routes) {
      handleServerResponseType(res as ServerResponse<IncomingMessage>, {
        error: 'Route Not Found',
        message: 'The requested route was not found.'
      });
      log.error_message = "Route Not Found";
      await insertProxyLog(log);
      return process.env.FALLBACK_URL ?? "";
    }

    // Both exist — safe to use
    const targetUrl = row.client_routes.target_url;
    log.target_url = targetUrl;
    req.headers['targeturl'] = targetUrl;
    req.headers['x-client-id'] = row.clients.id;

    const rateLimitKey = `route:${subdomain}:${route}`;

    const requestRate = await redisClient.get(rateLimitKey);

    if (requestRate && parseInt(requestRate) >= 100) {
      
      handleServerResponseType(res as ServerResponse<IncomingMessage>, {
        error: 'Rate Limit Exceeded',
        message: 'You have exceeded the maximum number of requests allowed. Please try again later.'
      });
      log.error_message = "Rate Limit Exceeded";
      await insertProxyLog(log);
      return process.env.FALLBACK_URL ?? "";
    }

    if (!token || token.trim() === "") {
      handleServerResponseType(res as ServerResponse<IncomingMessage>, {
        error: 'Token Missing',
        message: 'Authorization token is required.'
      });
      log.error_message = "Token Missing";
      await insertProxyLog(log);
      return process.env.FALLBACK_URL ?? "";
    }

    if (!subdomain || subdomain.trim() === "") {
      handleServerResponseType(res as ServerResponse<IncomingMessage>, {
        error: 'Subdomain Missing',
        message: 'Subdomain is required.'
      });
      log.error_message = "Subdomain Missing";
      await insertProxyLog(log);
      return process.env.FALLBACK_URL ?? "";
    }

    try {
      const decodedPayload = jwt.verify(token, process.env.JWT_SECRET ?? "");
      const finalUrl = (targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`) + expressReq.baseUrl;
      await redisClient.set(rateLimitKey, parseInt(requestRate ?? "0") + 1, {
        EX: 120 // EX specifies expiration in seconds
      });

      return finalUrl; // Append the original request URL to the target URL

    }
    catch (error: any) {
      handleServerResponseType(res, {
        error: 'Invalid Token',
        message: error.message || 'The provided token is invalid.'
      })
      log.error_message = "Invalid Token";
      await insertProxyLog(log);
      return process.env.FALLBACK_URL ?? "";
    }

  },
  on: {
    error: (err, req, res) => {
      
      const expressRes = res as unknown as Response;
      const customeRes = expressRes as unknown as ServerResponse & { req?: ClientRequest };
      // Send a custom error response to the client
      if (res instanceof ServerResponse) {
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({
          error: 'Bad Gateway',
          message: 'The upstream server could not be reached.'
        }));

        const log = {
          client_id: req.headers['x-client-id'] as string,
          method: customeRes.req?.method ?? "",
          route: customeRes.req?.path ?? "",
          target_url: req.headers['targeturl'] as string,
          timestamp: new Date().toISOString(),
          status_code: "502",
          response_time: "0",
          error_message: err.message ?? "",
        }
        const insertLog = insertProxyLog(log);

      } else {
        // 3. Handle WebSocket/Socket errors safely
        console.error('Socket error occurred');
        res.destroy(); // Safely close the socket connection
      }
    },
    proxyRes: (proxyRes, req, res) => {

      const customeProxyRes = proxyRes as unknown as IncomingMessage & {
        req?: ClientRequest
      };
      const log = {
        client_id: req.headers['x-client-id'] as string,
        method: customeProxyRes.req?.method ?? "",
        route: customeProxyRes.req?.path ?? "",
        target_url: req.headers['targeturl'] as string,
        timestamp: new Date().toISOString(),
        status_code: customeProxyRes.statusCode?.toString() ?? "",
        response_time: customeProxyRes.headers['x-response-time']?.toString() ?? "",
        error_message: customeProxyRes.statusMessage ?? "",
      };
      insertProxyLog(log)
    },
  }

});


function handleServerResponseType(res: ServerResponse<IncomingMessage> | undefined, data: { error: string, message: string }) {
  if (res instanceof ServerResponse) {
    res.writeHead(502, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify(data));
  }
}


export default dynamicProxy;
