import knex from 'knex';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../admo.db');

export const db = knex({
  client: 'sqlite3',
  connection: { filename: DB_PATH },
  useNullAsDefault: true,
});

export async function initDb() {
  await db.schema.createTableIfNotExists('users', (t) => {
    t.string('id').primary();
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password').notNullable();
    t.string('date_of_birth');
    t.timestamp('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTableIfNotExists('boxes', (t) => {
    t.string('id').primary();
    t.string('device_code').notNullable().unique();
    t.string('user_id').notNullable().references('id').inTable('users');
    t.string('person_name');
    t.string('person_age');
    t.string('note');
    t.timestamp('connected_at').defaultTo(db.fn.now());
  });

  await db.schema.createTableIfNotExists('medications', (t) => {
    t.string('id').primary();
    t.string('box_id').nullable().references('id').inTable('boxes');
    t.string('user_id').notNullable().references('id').inTable('users');
    t.string('name').notNullable();
    t.string('dose').notNullable();
    t.boolean('active').defaultTo(true);
    t.string('days'); // JSON array e.g. ["Mon","Tue"]
    t.timestamp('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTableIfNotExists('medication_times', (t) => {
    t.string('id').primary();
    t.string('medication_id').notNullable().references('id').inTable('medications');
    t.string('label'); // Morning, Afternoon, Night
    t.string('time').notNullable(); // HH:mm
    t.integer('pills').defaultTo(1);
  });

  await db.schema.createTableIfNotExists('medication_history', (t) => {
    t.string('id').primary();
    t.string('medication_id').notNullable().references('id').inTable('medications');
    t.string('user_id').notNullable().references('id').inTable('users');
    t.string('status').notNullable(); // Taken, Missed, Late
    t.string('scheduled_time').notNullable();
    t.string('taken_at');
    t.string('date').notNullable();
  });

  await db.schema.createTableIfNotExists('notification_settings', (t) => {
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

  await db.schema.createTableIfNotExists('password_reset_tokens', (t) => {
    t.string('id').primary();
    t.string('user_id').notNullable().references('id').inTable('users');
    t.string('token').notNullable().unique();
    t.string('expires_at').notNullable();
    t.integer('used').defaultTo(0);
  });

  console.log('✅ Database initialised at', DB_PATH);
}
