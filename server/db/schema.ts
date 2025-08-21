import {
  pgTable,
  bigserial,
  text,
  timestamp,
  jsonb,
  index,
  varchar,
  boolean,
  bigint,
  uuid,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core'

// Organizations must be defined first as other tables reference it
export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    address: jsonb('address'),
    tax_id: text('tax_id'),
    metadata: jsonb('metadata'),
    members: jsonb('members').array().default([]),
    invitations: jsonb('invitations').array().default([]),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    slugIdx: index('idx_organizations_slug').on(table.slug),
    createdAtIdx: index('idx_organizations_created_at').on(table.created_at),
    membersIdx: index('idx_organizations_members').using('gin', table.members),
    invitationsIdx: index('idx_organizations_invitations').using('gin', table.invitations),
  }),
)


export const drivers = pgTable(
  'drivers',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    license_number: text('license_number'),
    username: varchar('username', { length: 255 }).notNull().unique(),
    hashed_password: text('hashed_password').notNull(),
    is_active: boolean('is_active').notNull().default(true),
    organization_id: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    nameIdx: index('idx_drivers_name').on(table.name),
    isActiveIdx: index('idx_drivers_is_active').on(table.is_active),
    phoneIdx: index('idx_drivers_phone').on(table.phone),
    usernameIdx: index('idx_drivers_username').on(table.username),
    organizationIdIdx: index('idx_drivers_organization_id').on(table.organization_id),
  }),
)

export const cars = pgTable(
  'cars',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    plate_number: text('plate_number').notNull().unique(),
    make: text('make'),
    model: text('model'),
    year: text('year'),
    color: text('color'),
    is_active: boolean('is_active').notNull().default(true),
    organization_id: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    plateNumberIdx: index('idx_cars_plate_number').on(table.plate_number),
    isActiveIdx: index('idx_cars_is_active').on(table.is_active),
    makeModelIdx: index('idx_cars_make_model').on(table.make, table.model),
    organizationIdIdx: index('idx_cars_organization_id').on(table.organization_id),
  }),
)

export const missions = pgTable(
  'missions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    type: text('type').notNull(),
    subtype: text('subtype'),
    address: jsonb('address').notNull(),
    driver: text('driver'),
    car_number: text('car_number'),
    status: text('status', {
      enum: ['unassigned', 'waiting', 'in_progress', 'completed', 'problem'],
    })
      .notNull()
      .default('unassigned'),
    date_expected: timestamp('date_expected', { withTimezone: true }),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    certificates: jsonb('certificates'),
    metadata: jsonb('metadata'),
    car_id: bigint('car_id', { mode: 'number' }).references(() => cars.id, {
      onDelete: 'set null',
    }),
    driver_id: bigint('driver_id', { mode: 'number' }).references(
      () => drivers.id,
      { onDelete: 'set null' },
    ),
    organization_id: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    typeIdx: index('idx_missions_type').on(table.type),
    statusIdx: index('idx_missions_status').on(table.status),
    driverIdx: index('idx_missions_driver').on(table.driver),
    dateExpectedIdx: index('idx_missions_date_expected').on(table.date_expected),
    createdAtIdx: index('idx_missions_created_at').on(table.created_at),
    addressIdx: index('idx_missions_address').using('gin', table.address),
    metadataIdx: index('idx_missions_metadata').using('gin', table.metadata),
    carIdIdx: index('idx_missions_car_id').on(table.car_id),
    driverIdIdx: index('idx_missions_driver_id').on(table.driver_id),
    organizationIdIdx: index('idx_missions_organization_id').on(table.organization_id),
  }),
)

export const accounts = pgTable(
  'accounts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    hashed_password: text('hashed_password'),
    provider: text('provider').notNull().default('google'),
    provider_id: text('provider_id'),
    is_verified: boolean('is_verified').notNull().default(false),
    last_login: timestamp('last_login', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_accounts_email').on(table.email),
    providerIdx: index('idx_accounts_provider').on(table.provider),
    providerIdIdx: index('idx_accounts_provider_id').on(table.provider_id),
  }),
)

export const inspectionStatus = pgEnum('inspection_status', ['ok', 'not_ok'])

export const vehicleInspections = pgTable(
  'vehicle_inspections',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    driver_id: bigint('driver_id', { mode: 'number' })
      .references(() => drivers.id, { onDelete: 'cascade' })
      .notNull(),
    car_id: bigint('car_id', { mode: 'number' }).references(() => cars.id, {
      onDelete: 'set null',
    }),
    vehicle_number: varchar('vehicle_number', { length: 255 }).notNull(),
    registration_number: varchar('registration_number', { length: 255 }).notNull(),
    driver_name: varchar('driver_name', { length: 255 }).notNull(),
    inspection_date: varchar('inspection_date', { length: 255 }).notNull(),
    inspection_time: varchar('inspection_time', { length: 255 }),
    odometer_reading: varchar('odometer_reading', { length: 255 }).notNull(),
    engine_oil: inspectionStatus('engine_oil').notNull(),
    coolant_water: inspectionStatus('coolant_water').notNull(),
    windshield_washer_fluid: inspectionStatus('windshield_washer_fluid').notNull(),
    battery: inspectionStatus('battery').notNull(),
    five_l_backup_fuses: inspectionStatus('five_l_backup_fuses').notNull(),
    tire_tool_kit: inspectionStatus('tire_tool_kit').notNull(),
    spare_tire: inspectionStatus('spare_tire').notNull(),
    spare_tire_tool_kit: inspectionStatus('spare_tire_tool_kit').notNull(),
    reflective_vest_50_percent: inspectionStatus('reflective_vest_50_percent').notNull(),
    reflective_triangle_50_percent: inspectionStatus('reflective_triangle_50_percent').notNull(),
    first_aid_kit: inspectionStatus('first_aid_kit').notNull(),
    fire_extinguisher: inspectionStatus('fire_extinguisher').notNull(),
    jack: inspectionStatus('jack').notNull(),
    tire_iron: inspectionStatus('tire_iron').notNull(),
    spare_wheel: inspectionStatus('spare_wheel').notNull(),
    spare_wheel_mounting_kit: inspectionStatus('spare_wheel_mounting_kit').notNull(),
    safety_vest_qty_1: inspectionStatus('safety_vest_qty_1').notNull(),
    safety_vest_qty_2: inspectionStatus('safety_vest_qty_2').notNull(),
    safety_vest_qty_3: inspectionStatus('safety_vest_qty_3').notNull(),
    safety_vest_qty_4: inspectionStatus('safety_vest_qty_4').notNull(),
    safety_vest_qty_5: inspectionStatus('safety_vest_qty_5').notNull(),
    towing_hook_qty_1: inspectionStatus('towing_hook_qty_1').notNull(),
    towing_hook_qty_2: inspectionStatus('towing_hook_qty_2').notNull(),
    jumper_cables_qty_2: inspectionStatus('jumper_cables_qty_2').notNull(),
    wheel_chocks_qty_2: inspectionStatus('wheel_chocks_qty_2').notNull(),
    cellphone_charger_qty_1: inspectionStatus('cellphone_charger_qty_1').notNull(),
    paint_and_body: text('paint_and_body').notNull(),
    spare_keys: text('spare_keys').notNull(),
    vehicle_damage_diagram: jsonb('vehicle_damage_diagram').notNull(),
    notes: text('notes'),
    events_obligating_reporting: text('events_obligating_reporting'),
    driver_signature: text('driver_signature').notNull(),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    driverIdIdx: index('idx_vehicle_inspections_driver_id').on(table.driver_id),
    carIdIdx: index('idx_vehicle_inspections_car_id').on(table.car_id),
  }),
)

export const emergencyReports = pgTable(
  'emergency_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    driver_id: bigint('driver_id', { mode: 'number' }).references(() => drivers.id, { onDelete: 'cascade' }),
    car_id: bigint('car_id', { mode: 'number' }).references(() => cars.id, { onDelete: 'cascade' }),
    type: text('type').default('general'),
    form_completion_date: text('form_completion_date'),
    identifier_name: text('identifier_name'),
    incident_date: text('incident_date'),
    incident_time: text('incident_time'),
    incident_description: text('incident_description'),
    vehicle_number: text('vehicle_number'),
    driver_at_time: text('driver_at_time'),
    employee_involved: text('employee_involved'),
    identifier_signature: text('identifier_signature'),
    crash_data: jsonb('crash_data'),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    driverIdIdx: index('idx_emergency_reports_driver_id').on(table.driver_id),
    carIdIdx: index('idx_emergency_reports_car_id').on(table.car_id),
    createdAtIdx: index('idx_emergency_reports_created_at').on(table.created_at),
  }),
)

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: text('name').notNull(),
    age: integer('age'),
    company: text('company').notNull().default('medikal'),
    avatar_url: text('avatar_url'),
    approved: boolean('approved').notNull().default(false),
    organization_ids: uuid('organization_ids').array().notNull().default(['1c595cc2-0e29-4b19-84f3-ab4ec61f655c']),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_user_profiles_email').on(table.email),
    companyIdx: index('idx_user_profiles_company').on(table.company),
    approvedIdx: index('idx_user_profiles_approved').on(table.approved),
    organizationIdsIdx: index('idx_user_profiles_organization_ids').using('gin', table.organization_ids),
    createdAtIdx: index('idx_user_profiles_created_at').on(table.created_at),
  }),
)

export type Mission = typeof missions.$inferSelect
export type NewMission = typeof missions.$inferInsert
export type Driver = typeof drivers.$inferSelect
export type NewDriver = typeof drivers.$inferInsert
export type Car = typeof cars.$inferSelect
export type NewCar = typeof cars.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type VehicleInspection = typeof vehicleInspections.$inferSelect
export type NewVehicleInspection = typeof vehicleInspections.$inferInsert
export type EmergencyReport = typeof emergencyReports.$inferSelect
export type NewEmergencyReport = typeof emergencyReports.$inferInsert
export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert