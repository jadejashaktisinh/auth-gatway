import { eq } from "drizzle-orm/pg-core/expressions";
import { db } from "../db/db.js";
import { clients } from "../db/schema/schema.js";


type clientData = {
  id: string;
  companyName: string;
  apiKey: string;
};

export async function insertClient(clientData: clientData): Promise<boolean> {
  const client = await db.insert(clients).values(clientData).returning();

  return !!client;
}


export async function getClientById(clientId: string): Promise<clientData | false> {
  const client = await db.select().from(clients).where(eq(clients.id,clientId)).limit(1);

  if (!client || client.length === 0 || !client[0]) {
    return false;
  }

  return client[0];
}