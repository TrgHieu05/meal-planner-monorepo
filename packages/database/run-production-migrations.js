const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { Client } = require('pg');

const packageRoot = __dirname;
const workspaceRoot = path.resolve(packageRoot, '..', '..');
const schemaPath = path.join(packageRoot, 'prisma', 'schema.prisma');
const prismaCliPath = resolvePrismaCliPath();
const isPlanOnly = process.argv.includes('--plan-only');

const migrationDefinitions = [
  {
    name: '20260310163258_initial_schema',
    isPresent: async (client) => {
      const [providerEnumExists, usersExists, userProvidersExists, profilesExists, mealsExists] = await Promise.all([
        enumExists(client, 'ProviderEnum'),
        tableExists(client, 'users'),
        tableExists(client, 'user_providers'),
        tableExists(client, 'profiles'),
        tableExists(client, 'meals'),
      ]);

      return providerEnumExists && usersExists && userProvidersExists && profilesExists && mealsExists;
    },
  },
  {
    name: '20260315153334_v2_bigint_to_int',
    isPresent: async (client) => {
      const [ingredientsIdType, mealsIdType, menuItemsIdType, profilesDietTypeType] = await Promise.all([
        columnType(client, 'ingredients', 'id'),
        columnType(client, 'meals', 'id'),
        columnType(client, 'menu_items', 'id'),
        columnType(client, 'profiles', 'diet_type'),
      ]);

      return (
        ingredientsIdType === 'integer' &&
        mealsIdType === 'integer' &&
        menuItemsIdType === 'integer' &&
        profilesDietTypeType === 'integer'
      );
    },
  },
  {
    name: '20260414123000_menu_unique_constraints',
    isPresent: async (client) => {
      const [menuDateIndexExists, menuItemUniqueIndexExists] = await Promise.all([
        indexExists(client, 'menus_user_id_date_key'),
        indexExists(client, 'menu_items_menu_id_meal_id_meal_time_key'),
      ]);

      return menuDateIndexExists && menuItemUniqueIndexExists;
    },
  },
  {
    name: '20260426203500_user_provider_compound_unique',
    isPresent: async (client) => indexExists(client, 'user_providers_provider_provider_id_key'),
  },
  {
    name: '20260501110842_user_gender_nullable',
    isPresent: async (client) => columnIsNullable(client, 'users', 'gender'),
  },
  {
    name: '20260501141737_new_constraint',
    isPresent: async (client) => indexExists(client, 'meal_template_days_template_id_day_number_key'),
  },
];

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[migrate-release] ${message}`);
  process.exit(1);
});

async function main() {
  ensureFileExists(schemaPath, 'Prisma schema');
  ensureFileExists(prismaCliPath, 'Prisma CLI');

  console.log(
    `[migrate-release] Known migrations: ${migrationDefinitions.map((migration) => migration.name).join(', ')}`,
  );

  if (isPlanOnly) {
    console.log('[migrate-release] Plan-only mode enabled. Skipping database inspection.');
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run production migrations.');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await baselineLegacySchemaIfNeeded(client);
    await ensureNoFailedMigrationsRemain(client);
  } finally {
    await client.end();
  }

  console.log('[migrate-release] Running prisma migrate deploy.');
  runPrisma(['migrate', 'deploy', '--schema', schemaPath]);
}

async function baselineLegacySchemaIfNeeded(client) {
  let migrationStates = await loadMigrationStates(client);
  let canInferPrefix = true;

  for (const migration of migrationDefinitions) {
    const state = migrationStates.get(migration.name) ?? 'missing';
    const markerExists = await migration.isPresent(client);

    if (state === 'applied') {
      continue;
    }

    if (!canInferPrefix) {
      if (state !== 'missing' || markerExists) {
        throw new Error(
          `Detected a migration history gap before ${migration.name}. Prisma history is not a clean prefix of the existing schema, so automatic recovery was skipped. Resolve it manually with prisma migrate resolve.`,
        );
      }

      continue;
    }

    if (state === 'failed') {
      if (!markerExists) {
        throw new Error(
          `Migration ${migration.name} is recorded as failed, but the schema marker for that migration is not present. Resolve this migration manually before retrying production deployment.`,
        );
      }

      console.log(`[migrate-release] Marking failed migration as applied: ${migration.name}`);
      runPrisma(['migrate', 'resolve', '--applied', migration.name, '--schema', schemaPath]);
      migrationStates = await loadMigrationStates(client);
      continue;
    }

    if (state === 'rolled_back') {
      canInferPrefix = false;
      continue;
    }

    if (markerExists) {
      console.log(`[migrate-release] Baselining existing schema marker as applied: ${migration.name}`);
      runPrisma(['migrate', 'resolve', '--applied', migration.name, '--schema', schemaPath]);
      migrationStates = await loadMigrationStates(client);
      continue;
    }

    canInferPrefix = false;
  }
}

async function ensureNoFailedMigrationsRemain(client) {
  if (!(await tableExists(client, '_prisma_migrations'))) {
    return;
  }

  const result = await client.query(`
    SELECT migration_name
    FROM "_prisma_migrations"
    WHERE finished_at IS NULL AND rolled_back_at IS NULL
    ORDER BY started_at ASC NULLS LAST, migration_name ASC
  `);

  if (result.rows.length === 0) {
    return;
  }

  const failedMigrations = result.rows.map((row) => row.migration_name).join(', ');
  throw new Error(
    `Unresolved failed migrations remain in _prisma_migrations: ${failedMigrations}. Resolve them manually with prisma migrate resolve before retrying production deployment.`,
  );
}

async function loadMigrationStates(client) {
  if (!(await tableExists(client, '_prisma_migrations'))) {
    return new Map();
  }

  const result = await client.query(`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY started_at ASC NULLS LAST, migration_name ASC
  `);

  const states = new Map();

  for (const row of result.rows) {
    if (row.finished_at && !row.rolled_back_at) {
      states.set(row.migration_name, 'applied');
      continue;
    }

    if (row.rolled_back_at) {
      states.set(row.migration_name, 'rolled_back');
      continue;
    }

    states.set(row.migration_name, 'failed');
  }

  return states;
}

function runPrisma(args) {
  execFileSync(process.execPath, [prismaCliPath, ...args], {
    cwd: packageRoot,
    env: process.env,
    stdio: 'inherit',
  });
}

function resolvePrismaCliPath() {
  const candidates = [
    path.join(packageRoot, 'node_modules', 'prisma', 'build', 'index.js'),
    path.join(workspaceRoot, 'node_modules', 'prisma', 'build', 'index.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Unable to find Prisma CLI runtime in packages/database or workspace node_modules.');
}

function ensureFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found at ${filePath}.`);
  }
}

async function tableExists(client, tableName) {
  const result = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      ) AS exists
    `,
    [tableName],
  );

  return result.rows[0]?.exists === true;
}

async function enumExists(client, enumName) {
  const result = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM pg_type type
        INNER JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
        WHERE namespace.nspname = 'public' AND type.typname = $1
      ) AS exists
    `,
    [enumName],
  );

  return result.rows[0]?.exists === true;
}

async function indexExists(client, indexName) {
  const result = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = $1
      ) AS exists
    `,
    [indexName],
  );

  return result.rows[0]?.exists === true;
}

async function columnType(client, tableName, columnName) {
  const result = await client.query(
    `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
      LIMIT 1
    `,
    [tableName, columnName],
  );

  return result.rows[0]?.data_type ?? null;
}

async function columnIsNullable(client, tableName, columnName) {
  const result = await client.query(
    `
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
      LIMIT 1
    `,
    [tableName, columnName],
  );

  return result.rows[0]?.is_nullable === 'YES';
}