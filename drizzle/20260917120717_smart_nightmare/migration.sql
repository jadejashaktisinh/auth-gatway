CREATE TABLE "proxy_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"client_id" uuid NOT NULL,
	"method" varchar(10) NOT NULL,
	"route" varchar(255) NOT NULL,
	"target_url" varchar(255) NOT NULL,
	"timestamp" varchar(255) NOT NULL,
	"status_code" varchar(255) NOT NULL,
	"response_time" varchar(255) NOT NULL,
	"error_message" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "proxy_logs" ADD CONSTRAINT "proxy_logs_client_id_clients_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE;