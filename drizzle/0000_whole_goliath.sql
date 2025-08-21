CREATE TYPE "public"."inspection_status" AS ENUM('ok', 'not_ok');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"hashed_password" text,
	"provider" text DEFAULT 'google' NOT NULL,
	"provider_id" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "cars" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"plate_number" text NOT NULL,
	"make" text,
	"model" text,
	"year" text,
	"color" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb,
	CONSTRAINT "cars_plate_number_unique" UNIQUE("plate_number")
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"license_number" text,
	"username" varchar(255) NOT NULL,
	"hashed_password" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb,
	CONSTRAINT "drivers_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "emergency_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" bigint,
	"car_id" bigint,
	"type" text DEFAULT 'general',
	"form_completion_date" text,
	"identifier_name" text,
	"incident_date" text,
	"incident_time" text,
	"incident_description" text,
	"vehicle_number" text,
	"driver_at_time" text,
	"employee_involved" text,
	"identifier_signature" text,
	"crash_data" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"subtype" text,
	"address" jsonb NOT NULL,
	"driver" text,
	"car_number" text,
	"status" text DEFAULT 'unassigned' NOT NULL,
	"date_expected" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"certificates" jsonb,
	"metadata" jsonb,
	"car_id" bigint,
	"driver_id" bigint
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"age" integer,
	"company" text DEFAULT 'medikal' NOT NULL,
	"avatar_url" text,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_inspections" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"driver_id" bigint NOT NULL,
	"car_id" bigint,
	"vehicle_number" varchar(255) NOT NULL,
	"registration_number" varchar(255) NOT NULL,
	"driver_name" varchar(255) NOT NULL,
	"inspection_date" varchar(255) NOT NULL,
	"inspection_time" varchar(255),
	"odometer_reading" varchar(255) NOT NULL,
	"engine_oil" "inspection_status" NOT NULL,
	"coolant_water" "inspection_status" NOT NULL,
	"windshield_washer_fluid" "inspection_status" NOT NULL,
	"battery" "inspection_status" NOT NULL,
	"five_l_backup_fuses" "inspection_status" NOT NULL,
	"tire_tool_kit" "inspection_status" NOT NULL,
	"spare_tire" "inspection_status" NOT NULL,
	"spare_tire_tool_kit" "inspection_status" NOT NULL,
	"reflective_vest_50_percent" "inspection_status" NOT NULL,
	"reflective_triangle_50_percent" "inspection_status" NOT NULL,
	"first_aid_kit" "inspection_status" NOT NULL,
	"fire_extinguisher" "inspection_status" NOT NULL,
	"jack" "inspection_status" NOT NULL,
	"tire_iron" "inspection_status" NOT NULL,
	"spare_wheel" "inspection_status" NOT NULL,
	"spare_wheel_mounting_kit" "inspection_status" NOT NULL,
	"safety_vest_qty_1" "inspection_status" NOT NULL,
	"safety_vest_qty_2" "inspection_status" NOT NULL,
	"safety_vest_qty_3" "inspection_status" NOT NULL,
	"safety_vest_qty_4" "inspection_status" NOT NULL,
	"safety_vest_qty_5" "inspection_status" NOT NULL,
	"towing_hook_qty_1" "inspection_status" NOT NULL,
	"towing_hook_qty_2" "inspection_status" NOT NULL,
	"jumper_cables_qty_2" "inspection_status" NOT NULL,
	"wheel_chocks_qty_2" "inspection_status" NOT NULL,
	"cellphone_charger_qty_1" "inspection_status" NOT NULL,
	"paint_and_body" text NOT NULL,
	"spare_keys" text NOT NULL,
	"vehicle_damage_diagram" jsonb NOT NULL,
	"notes" text,
	"events_obligating_reporting" text,
	"driver_signature" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "emergency_reports" ADD CONSTRAINT "emergency_reports_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_reports" ADD CONSTRAINT "emergency_reports_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_email" ON "accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_accounts_provider" ON "accounts" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_accounts_provider_id" ON "accounts" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_cars_plate_number" ON "cars" USING btree ("plate_number");--> statement-breakpoint
CREATE INDEX "idx_cars_is_active" ON "cars" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_cars_make_model" ON "cars" USING btree ("make","model");--> statement-breakpoint
CREATE INDEX "idx_drivers_name" ON "drivers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_drivers_is_active" ON "drivers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_drivers_phone" ON "drivers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_drivers_username" ON "drivers" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_emergency_reports_driver_id" ON "emergency_reports" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_emergency_reports_car_id" ON "emergency_reports" USING btree ("car_id");--> statement-breakpoint
CREATE INDEX "idx_emergency_reports_created_at" ON "emergency_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_missions_type" ON "missions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_missions_status" ON "missions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_missions_driver" ON "missions" USING btree ("driver");--> statement-breakpoint
CREATE INDEX "idx_missions_date_expected" ON "missions" USING btree ("date_expected");--> statement-breakpoint
CREATE INDEX "idx_missions_created_at" ON "missions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_missions_address" ON "missions" USING gin ("address");--> statement-breakpoint
CREATE INDEX "idx_missions_metadata" ON "missions" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "idx_missions_car_id" ON "missions" USING btree ("car_id");--> statement-breakpoint
CREATE INDEX "idx_missions_driver_id" ON "missions" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_email" ON "user_profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_company" ON "user_profiles" USING btree ("company");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_approved" ON "user_profiles" USING btree ("approved");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_created_at" ON "user_profiles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_vehicle_inspections_driver_id" ON "vehicle_inspections" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_vehicle_inspections_car_id" ON "vehicle_inspections" USING btree ("car_id");