import {
  pgTable,
  bigserial,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

export const orders = pgTable(
  "orders",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    customer_id: text("customer_id"),
    client_name: text("client_name"),
    client_phone: text("client_phone"),
    address: text("address").notNull(),
    packages_count: integer("packages_count").notNull(),
    driver: text("driver"),
    car_number: text("car_number"),
    status: text("status", {
      enum: ["unassigned", "waiting", "in_progress", "completed", "problem"],
    })
      .notNull()
      .default("unassigned"),
    time_delivered: timestamp("time_delivered", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    statusIdx: index("idx_orders_status").on(table.status),
    driverIdx: index("idx_orders_driver").on(table.driver),
    createdAtIdx: index("idx_orders_created_at").on(table.created_at),
    customerIdIdx: index("idx_orders_customer_id").on(table.customer_id),
    metadataIdx: index("idx_orders_metadata").on(table.metadata),
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

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
