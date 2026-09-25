CREATE TYPE "public"."drink_type" AS ENUM('koffie', 'water', 'skip');--> statement-breakpoint
CREATE TYPE "public"."saldo_reason" AS ENUM('haal', 'besteld', 'opdracht_reset');--> statement-breakpoint
CREATE TABLE "office" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"heart_emoji" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"drink_type" "drink_type" NOT NULL,
	"drink" text DEFAULT '' NOT NULL,
	"option" text DEFAULT '' NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"office_id" text NOT NULL,
	"haler_user_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"settled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "round_settled_implies_closed" CHECK (NOT "round"."settled" OR "round"."closed_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "saldo_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"office_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"round_id" uuid,
	"delta" integer NOT NULL,
	"reason" "saldo_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"display_name" text NOT NULL,
	"office_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usual_order" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"drink_type" "drink_type" NOT NULL,
	"drink" text NOT NULL,
	"option" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round" ADD CONSTRAINT "round_office_id_office_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."office"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round" ADD CONSTRAINT "round_haler_user_id_user_id_fk" FOREIGN KEY ("haler_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saldo_event" ADD CONSTRAINT "saldo_event_office_id_office_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."office"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saldo_event" ADD CONSTRAINT "saldo_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saldo_event" ADD CONSTRAINT "saldo_event_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_office_id_office_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."office"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usual_order" ADD CONSTRAINT "usual_order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_round_user_uq" ON "order" USING btree ("round_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "round_one_open_per_office_uq" ON "round" USING btree ("office_id") WHERE "round"."closed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "round_office_started_idx" ON "round" USING btree ("office_id","started_at");--> statement-breakpoint
CREATE INDEX "saldo_event_office_user_idx" ON "saldo_event" USING btree ("office_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saldo_event_round_user_uq" ON "saldo_event" USING btree ("round_id","user_id") WHERE "saldo_event"."round_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_uq" ON "user" USING btree ("email");