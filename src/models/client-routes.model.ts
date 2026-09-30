import { db } from "../db/db.js";
import { client_routes } from "../db/schema/schema.js";

type clientRouteData = {
  client_id: string;
  client_path: string;
  target_url: string;
};

export async function insertClientRoute(clientRouteData: clientRouteData): Promise<boolean> {
  const clientRoute = await db.insert(client_routes).values(clientRouteData).returning();

  return !!clientRoute;
}
