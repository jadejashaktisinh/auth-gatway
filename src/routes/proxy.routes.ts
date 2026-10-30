import "dotenv/config";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { ClientRequest, IncomingMessage, ServerResponse } from "http";
import { insertProxyLog } from "../models/proxy-log.model.js";
import type { Socket } from "net";
import type { ProxyRequest, ProxyLog } from "../types/proxy.types.js";
import { extractCompany, rejectRequest } from "../utils/proxy/proxy.utils.js";

const dynamicProxySubdomain = proxyMiddlewareFactory();
const dynamicProxySubdirectory = proxyMiddlewareFactory();

function proxyMiddlewareFactory() {
  return createProxyMiddleware({
    target: "http://localhost:default-fallback", // Fallback target
    changeOrigin: true,
    router: async (req, res) => {
      const expressReq = req as ProxyRequest;
      const extracted = extractCompany(expressReq);
      const proxyUrl = await handleProxyRouter(
        extracted,
        req,
        res as ServerResponse<IncomingMessage>,
      );
      return proxyUrl;
    },
    on: {
      error: handleProxyError,
      proxyRes: handleProxyResponse,
      proxyReq: fixRequestBody,
    },
  });
}

async function handleProxyRouter(
  extracted: string,
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
) {
  const expressReq = req as ProxyRequest;
  const targetUrl = req.headers["targeturl"];

  if (!targetUrl || Array.isArray(targetUrl)) {
    return await rejectRequest(
      "Target URL not found",
      "Target URL not found.",
      res,
      404,
    );
  }
  let endpoint = expressReq.baseUrl;
  if (!expressReq.vhost) {
    endpoint = endpoint.replace("p/" + extracted + "/", "");
  }
  const finalUrl =
    (targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`) +
    endpoint;
  return finalUrl.trim(); // Append the original request URL to the target URL
}

function handleProxyError(
  err: Error,
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage> | Socket,
) {
  const expressRes = res as unknown as Response;
  const customeRes = expressRes as unknown as ServerResponse & {
    req?: ClientRequest;
  };
  // Send a custom error response to the client
  if (res instanceof ServerResponse) {
    res.writeHead(502, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        error: "Bad Gateway",
        message: "The upstream server could not be reached.",
      }),
    );

    const log = {
      client_id: req.headers["x-client-id"] as string,
      method: customeRes.req?.method ?? "",
      route: customeRes.req?.path ?? "",
      target_url: req.headers["targeturl"] as string,
      timestamp: new Date().toISOString(),
      status_code: "502",
      response_time: "0",
      error_message: err.message ?? "",
    };
    insertProxyLog(log);
  } else {
    // 3. Handle WebSocket/Socket errors safely
    console.error("Socket error occurred");
    res.destroy(); // Safely close the socket connection
  }
}

function handleProxyResponse(
  proxyRes: IncomingMessage,
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
) {
  const customeProxyRes = proxyRes as unknown as IncomingMessage & {
    req?: ClientRequest;
  };
  const log = {
    client_id: req.headers["x-client-id"] as string,
    method: customeProxyRes.req?.method ?? "",
    route: customeProxyRes.req?.path ?? "",
    target_url: req.headers["targeturl"] as string,
    timestamp: new Date().toISOString(),
    status_code: customeProxyRes.statusCode?.toString() ?? "",
    response_time: customeProxyRes.headers["x-response-time"]?.toString() ?? "",
    error_message: customeProxyRes.statusMessage ?? "",
  };
  insertProxyLog(log);
}

export { dynamicProxySubdomain, dynamicProxySubdirectory };
