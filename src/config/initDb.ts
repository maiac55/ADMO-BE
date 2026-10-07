import knex from 'knex';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../admo.db');

export const db = knex({
  client: 'sqlite3',
  connection: { filename: DB_PATH },
  useNullAsDefault: true,
});

async function createIfMissing(table: string, define: (t: knex.Knex.CreateTableBuilder) => void) {
  const exists = await db.schema.hasTable(table);
  if (!exists) await db.schema.createTable(table, define);
}

export async function initDb() {
  await createIfMissing('users', (t) => {
    t.string('id').primary();
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password').notNullable();
    t.string('date_of_birth');
    t.timestamp('created_at').defaultTo(db.fn.now());
  });

  await createIfMissing('boxes', (t) => {
    t.string('id').primary();
    t.string('device_code').notNullable().unique();
    t.string('user_id').notNullable().references('id').inTable('users');
    t.string('person_name');
    t.string('person_age');
    t.string('note');
    t.timestamp('connected_at').defaultTo(db.fn.now());
  });

  await createIfMissing('medications', (t) => {
    t.string('id').primary();
    t.string('box_id').nullable().references('id').inTable('boxes');
    t.string('user_id').notNullable().references('id').inTable('users');
    t.string('name').notNullable();
    t.string('dose').notNullable();
    t.boolean('active').defaultTo(true);
    t.string('days');
    t.timestamp('created_at').defaultTo(db.fn.now());
  });

  await createIfMissing('medication_times', (t) => {
    t.string('id').primary();
    t.string('medication_id').notNullable().references('id').inTable('medications');
    t.string('label');
    t.string('time').notNullable();
    t.integer('pills').defaultTo(1);
  });

  await createIfMissing('medication_history', (t) => {
    t.string('id').primary();
    t.string('medication_id').notNullable().references('id').inTable('medications');
    t.string('user_id').notNullable().references('id').inTable('users');
    t.string('status').notNullable();
    t.string('scheduled_time').notNullable();
    t.string('taken_at');
    t.string('date').notNullable();
  });

  await createIfMissing('notification_settings', (t) => {
    t.string('id').primary();
    t.string('user_id').notNullable().references('id').inTable('users').unique();
    t.boolean('reminders').defaultTo(true);
    t.boolean('taken').defaultTo(false);
    t.boolean('missed').defaultTo(true);
    t.boolean('refill').defaultTo(true);
    t.boolean('disconnected').defaultTo(true);
    t.boolean('mechanical').defaultTo(true);
    t.string('frequency').defaultTo('daily');
  });

  await createIfMissing('password_reset_tokens', (t) => {
    t.string('id').primary();
    t.string('user_id').notNullable().references('id').inTable('users');
    t.string('token').notNullable().unique();
    t.string('expires_at').notNullable();
    t.integer('used').defaultTo(0);
  });

  await createIfMissing('dispenser_slots', (t) => {
    t.string('slot').primary();      // morning | noon | evening
    t.string('time').notNullable();  // HH:MM
    t.boolean('enabled').defaultTo(true);
  });

  const defaultSlots = [
    { slot: 'morning', time: '08:00' },
    { slot: 'noon', time: '13:00' },
    { slot: 'evening', time: '20:00' },
  ];
  for (const d of defaultSlots) {
    const exists = await db('dispenser_slots').where({ slot: d.slot }).first();
    if (!exists) await db('dispenser_slots').insert({ ...d, enabled: true });
  }

  console.log('✅ Database initialised at', DB_PATH);
}
