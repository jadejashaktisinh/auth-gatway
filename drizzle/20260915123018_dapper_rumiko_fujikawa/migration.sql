ALTER TABLE "clients" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "company_name" SET DATA TYPE varchar(255) USING "company_name"::varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "api_key" SET DATA TYPE varchar(255) USING "api_key"::varchar(255);