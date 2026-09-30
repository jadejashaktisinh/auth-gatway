CREATE TABLE "client_routes" (
	"id" uuid DEFAULT gen_random_uuid(),
	"client_id" uuid NOT NULL,
	"client_path" varchar(255) NOT NULL,
	"target_url" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "company_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "api_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "client_routes" ADD CONSTRAINT "client_routes_client_id_clients_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE;