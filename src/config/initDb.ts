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

  await db.schema.createTableIfNotExists('password_reset_tokens', (t) => {
    t.string('id').primary();
    t.string('user_id').notNullable().references('id').inTable('users');
    t.string('token').notNullable().unique();
    t.string('expires_at').notNullable();
    t.integer('used').defaultTo(0);
  });

  console.log('✅ Database initialised at', DB_PATH);
}
