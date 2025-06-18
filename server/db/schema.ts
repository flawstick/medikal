import {
  pgTable,
  bigserial,
  text,
  timestamp,
  jsonb,
  index,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

export const missions = pgTable(
  "missions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    type: text("type").notNull(),
    subtype: text("subtype"),
    address: jsonb("address").notNull(),
    driver: text("driver"),
    car_number: text("car_number"),
    status: text("status", {
      enum: ["unassigned", "waiting", "in_progress", "completed", "problem"],
    })
      .notNull()
      .default("unassigned"),
    date_expected: timestamp("date_expected", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    certificates: jsonb("certificates"),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    statusIdx: index("idx_missions_status").on(table.status),
    typeIdx: index("idx_missions_type").on(table.type),
    driverIdx: index("idx_missions_driver").on(table.driver),
    createdAtIdx: index("idx_missions_created_at").on(table.created_at),
    dateExpectedIdx: index("idx_missions_date_expected").on(
      table.date_expected,
    ),
    addressIdx: index("idx_missions_address").on(table.address),
    certificatesIdx: index("idx_missions_certificates").on(table.certificates),
    metadataIdx: index("idx_missions_metadata").on(table.metadata),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    hashed_password: text("hashed_password"),
    provider: text("provider").notNull().default("google"), // google, email, etc.
    provider_id: text("provider_id"), // Google user ID
    is_verified: boolean("is_verified").notNull().default(false),
    last_login: timestamp("last_login", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_accounts_email").on(table.email),
    providerIdx: index("idx_accounts_provider").on(table.provider),
    providerIdIdx: index("idx_accounts_provider_id").on(table.provider_id),
  }),
);

export const drivers = pgTable(
  "drivers",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    license_number: text("license_number"),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    nameIdx: index("idx_drivers_name").on(table.name),
    isActiveIdx: index("idx_drivers_is_active").on(table.is_active),
    phoneIdx: index("idx_drivers_phone").on(table.phone),
  }),
);

export const cars = pgTable(
  "cars",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    plate_number: text("plate_number").notNull().unique(),
    make: text("make"),
    model: text("model"),
    year: text("year"),
    color: text("color"),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    plateNumberIdx: index("idx_cars_plate_number").on(table.plate_number),
    isActiveIdx: index("idx_cars_is_active").on(table.is_active),
    makeModelIdx: index("idx_cars_make_model").on(table.make, table.model),
  }),
);

export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;
export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;
export type Car = typeof cars.$inferSelect;
export type NewCar = typeof cars.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
