// schema.ts
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
});

export const client_routes = pgTable("client_routes", {
  id: uuid("id").defaultRandom(),
  client_id: uuid("client_id")
    .references(() => clients.id, {
      onDelete: "cascade",
    })
    .notNull(),
  client_path: varchar("client_path", { length: 255 }).notNull(),
  target_url: varchar("target_url", { length: 255 }).notNull(),
});


export const proxy_logs = pgTable("proxy_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  client_id: uuid("client_id")
    .references(() => clients.id, {
      onDelete: "cascade",
    })
    .notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  route: varchar("route", { length: 255 }).notNull(),
  target_url: varchar("target_url", { length: 255 }).notNull(),
  timestamp: varchar("timestamp", { length: 255 }).notNull(),
  status_code: varchar("status_code", { length: 255 }).notNull(), 
  response_time: varchar("response_time", { length: 255 }).notNull(),
  error_message: varchar("error_message", { length: 255 }),
});