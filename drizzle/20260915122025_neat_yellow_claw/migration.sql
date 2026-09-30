CREATE TABLE "clients" (
	"id" uuid DEFAULT gen_random_uuid(),
	"company_name" varchar,
	"api_key" varchar
);
