import { type Request, type Response } from "express";

import { db } from "../db/db.js";
import { client_routes, clients } from "../db/schema/schema.js";
import { eq } from "drizzle-orm/mysql-core/expressions";
import { validateParam, generateApiKey } from "../utils/utils.js";
import { getClientById } from "../models/clients.model.js";
import { insertClientRoute } from "../models/client-routes.model.js";

export async function handleClientRegistration(req: Request, res: Response) {
  const { companyName } = req.body;

  const client = await db
    .insert(clients)
    .values({
      companyName: companyName,
      apiKey: generateApiKey(),
    })
    .returning();

  if (!client) {
    return res.status(400).json({
      success: false,
      message: "Somethign went wrong please try again after sometime",
    });
  }

  res.status(200).json({
    success: true,
    message: "Registration Successfull",
    client: client,
  });
}

export async function handleClientRouteCreation(req: Request, res: Response) {
  const { clientid } = req.params;
  const { path, targeturl } = req.body;

  const client = await getClientById(clientid as string);
  const isExists = !!client;

  if (!isExists) {
    res.status(400).json({
      success: false,
      message: "client id does not exists",
    });
    return;
  }

  const client_route = insertClientRoute({
    client_id: client?.id ?? "",
    client_path: path,
    target_url: targeturl,
  });

  if (!client_route) {
    res.status(400).json({
      success: false,
      message: "something went wrong",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Route created successfully",
    client_route: client_route,
  });
  return;
}
