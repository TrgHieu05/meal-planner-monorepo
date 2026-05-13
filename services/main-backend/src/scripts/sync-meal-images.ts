import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import { readdir } from 'node:fs/promises';
import * as path from 'node:path';
import { parseArgs } from 'node:util';

import { PrismaClient } from '@meal/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { v2 as cloudinary } from 'cloudinary';

type MealRecord = {
  id: number;
  mealImageKey: string | null;
  name: string;
};

type ImageFileRecord = {
  absolutePath: string;
  baseName: string;
  extension: string;
};

type SyncAction = {
  file: ImageFileRecord;
  meal: MealRecord;
};

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);
const REPO_ROOT = path.resolve(__dirname, '../../../../');

async function main() {
  loadEnvironment();

  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      dryRun: {
        type: 'boolean',
        default: false,
      },
      overwrite: {
        type: 'boolean',
        default: false,
      },
      recursive: {
        type: 'boolean',
        default: false,
      },
      sourceDir: {
        type: 'string',
      },
    },
  });

  const sourceDirectory = resolveSourceDirectory(values.sourceDir);
  const isDryRun = Boolean(values.dryRun);
  const shouldOverwrite = Boolean(values.overwrite);
  const isRecursive = Boolean(values.recursive);

  const imageFiles = await collectImageFiles(sourceDirectory, isRecursive);
  if (imageFiles.length === 0) {
    throw new Error(
      `No supported image files were found in "${sourceDirectory}". Supported extensions: ${[
        ...SUPPORTED_IMAGE_EXTENSIONS,
      ].join(', ')}`,
    );
  }

  const prisma = createPrismaClient();
  await prisma.$connect();

  try {
    const meals = await prisma.meal.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        mealImageKey: true,
        name: true,
      },
    });

    const mealsByNormalizedName = buildUniqueNormalizedMap(
      meals,
      (meal) => meal.name,
      'meal names',
    );
    const filesByNormalizedName = buildUniqueNormalizedMap(
      imageFiles,
      (file) => file.baseName,
      'image file names',
    );

    const matchedActions: SyncAction[] = [];
    const filesWithoutMeals: ImageFileRecord[] = [];
    const mealsWithoutFiles = new Set(meals.map((meal) => meal.id));
    const skippedExisting: SyncAction[] = [];

    for (const file of imageFiles) {
      const meal = mealsByNormalizedName.get(normalizeName(file.baseName));

      if (!meal) {
        filesWithoutMeals.push(file);
        continue;
      }

      mealsWithoutFiles.delete(meal.id);

      const action = { file, meal };

      if (meal.mealImageKey && !shouldOverwrite) {
        skippedExisting.push(action);
        continue;
      }

      matchedActions.push(action);
    }

    const unresolvedMeals = meals.filter((meal) => mealsWithoutFiles.has(meal.id));

    printSummary({
      filesWithoutMeals,
      isDryRun,
      matchedActions,
      skippedExisting,
      unresolvedMeals,
    });

    if (isDryRun || matchedActions.length === 0) {
      return;
    }

    configureCloudinary();

    let uploadedCount = 0;
    for (const action of matchedActions) {
      const publicId = buildMealPublicId(action.meal.id);

      const result = await cloudinary.uploader.upload(action.file.absolutePath, {
        invalidate: true,
        overwrite: true,
        public_id: publicId,
        resource_type: 'image',
        unique_filename: false,
      });

      await prisma.meal.update({
        where: { id: action.meal.id },
        data: { mealImageKey: result.public_id },
      });

      uploadedCount += 1;
      console.log(`Uploaded ${action.file.baseName}${action.file.extension} -> ${result.public_id}`);
    }

    console.log(`Meal image sync completed. Uploaded ${uploadedCount} image(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

function loadEnvironment() {
  dotenv.config({
    path: path.resolve(REPO_ROOT, '.env'),
    quiet: true,
  });
  dotenv.config({
    override: true,
    path: path.resolve(REPO_ROOT, '.env.local'),
    quiet: true,
  });
}

function resolveSourceDirectory(sourceDirectory: string | undefined) {
  if (!sourceDirectory || sourceDirectory.trim().length === 0) {
    throw new Error('Missing required argument --sourceDir <path-to-meal-images>.');
  }

  const normalizedSourceDirectory = sourceDirectory.trim();
  const candidatePaths = path.isAbsolute(normalizedSourceDirectory)
    ? [normalizedSourceDirectory]
    : [
        path.resolve(process.cwd(), normalizedSourceDirectory),
        path.resolve(REPO_ROOT, normalizedSourceDirectory),
      ];

  const resolvedPath = candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
  if (!resolvedPath) {
    throw new Error(
      `Source directory does not exist. Checked: ${candidatePaths.join(', ')}`,
    );
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isDirectory()) {
    throw new Error(`Source path is not a directory: ${resolvedPath}`);
  }

  return resolvedPath;
}

async function collectImageFiles(sourceDirectory: string, isRecursive: boolean) {
  const directoryEntries = await readdir(sourceDirectory, { withFileTypes: true });
  const files: ImageFileRecord[] = [];

  for (const entry of directoryEntries) {
    const absolutePath = path.join(sourceDirectory, entry.name);

    if (entry.isDirectory()) {
      if (isRecursive) {
        files.push(...(await collectImageFiles(absolutePath, true)));
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
      continue;
    }

    files.push({
      absolutePath,
      baseName: path.basename(entry.name, extension),
      extension,
    });
  }

  files.sort((left, right) => left.baseName.localeCompare(right.baseName));

  return files;
}

function buildUniqueNormalizedMap<T>(
  items: readonly T[],
  getName: (item: T) => string,
  label: string,
) {
  const nextMap = new Map<string, T>();

  for (const item of items) {
    const normalizedName = normalizeName(getName(item));
    if (normalizedName.length === 0) {
      throw new Error(`Unable to normalize one of the ${label}.`);
    }

    if (nextMap.has(normalizedName)) {
      throw new Error(`Duplicate normalized ${label} detected for value "${getName(item)}".`);
    }

    nextMap.set(normalizedName, item);
  }

  return nextMap;
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function printSummary(input: {
  filesWithoutMeals: ImageFileRecord[];
  isDryRun: boolean;
  matchedActions: SyncAction[];
  skippedExisting: SyncAction[];
  unresolvedMeals: MealRecord[];
}) {
  console.log(`Dry run: ${input.isDryRun ? 'yes' : 'no'}`);
  console.log(`Matched image files: ${input.matchedActions.length}`);
  console.log(`Skipped because meal already has image: ${input.skippedExisting.length}`);
  console.log(`Image files without matching meal: ${input.filesWithoutMeals.length}`);
  console.log(`Meals without matching image file: ${input.unresolvedMeals.length}`);

  if (input.filesWithoutMeals.length > 0) {
    console.log('Files without matching meal:');
    for (const file of input.filesWithoutMeals) {
      console.log(`- ${file.baseName}${file.extension}`);
    }
  }

  if (input.unresolvedMeals.length > 0) {
    console.log('Meals without matching image file:');
    for (const meal of input.unresolvedMeals) {
      console.log(`- ${meal.name}`);
    }
  }
}

function configureCloudinary() {
  const cloudName = getRequiredEnvironmentValue('CLOUDINARY_CLOUD_NAME');
  const apiKey = getRequiredEnvironmentValue('CLOUDINARY_API_KEY');
  const apiSecret = getRequiredEnvironmentValue('CLOUDINARY_API_SECRET');

  cloudinary.config({
    api_key: apiKey,
    api_secret: apiSecret,
    cloud_name: cloudName,
    secure: true,
    signature_algorithm: 'sha256',
  });
}

function createPrismaClient() {
  const databaseUrl = getRequiredEnvironmentValue('DATABASE_URL');
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  return new PrismaClient({ adapter });
}

function buildMealPublicId(mealId: number) {
  return `meals/${mealId}/cover`;
}

function getRequiredEnvironmentValue(key: string) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`${key} is not configured.`);
  }

  return value;
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : `${error}`;
  console.error(message);
  process.exitCode = 1;
});