CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"potions" jsonb DEFAULT '{"health":0,"ki":0,"immunity":0,"score":0}'::jsonb NOT NULL,
	CONSTRAINT "inventory_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_name" text NOT NULL,
	"score" integer NOT NULL,
	"wave" integer DEFAULT 1 NOT NULL,
	"enemies_defeated" integer NOT NULL,
	"play_time" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "upgrades" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"stats" jsonb DEFAULT '{"health":0,"damage":0,"speed":0,"ki":0}'::jsonb NOT NULL,
	CONSTRAINT "upgrades_wallet_address_unique" UNIQUE("wallet_address")
);
