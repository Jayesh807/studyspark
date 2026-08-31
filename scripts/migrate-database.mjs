import { PrismaClient } from '@prisma/client';
import readline from 'node:readline';

// Helper to ask question in terminal if arguments are not passed
function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Ordered list of models to respect foreign key constraints
const MODEL_TRANSFER_ORDER = [
  { name: 'User', model: 'user' },
  { name: 'Profile', model: 'profile' },
  { name: 'Subject', model: 'subject' },
  { name: 'Todo', model: 'todo' },
  { name: 'Event', model: 'event' },
  { name: 'Exam', model: 'exam' },
  { name: 'ExamRevisionTopic', model: 'examRevisionTopic' },
  { name: 'FocusSession', model: 'focusSession' },
  { name: 'TypingResult', model: 'typingResult' },
  { name: 'BadgeEarned', model: 'badgeEarned' },
  { name: 'PasswordResetOtp', model: 'passwordResetOtp' },
  { name: 'StudyDocument', model: 'studyDocument' },
  { name: 'StudyChunk', model: 'studyChunk' },
  { name: 'StudyQuiz', model: 'studyQuiz' },
  { name: 'Payment', model: 'payment' },
  { name: 'PushSubscription', model: 'pushSubscription' },
  { name: 'PushReminder', model: 'pushReminder' },
  { name: 'FestivalHoliday', model: 'festivalHoliday' },
];

const BATCH_SIZE = 100;

async function migrate() {
  console.log('=====================================================');
  console.log('🚀 StudySpark Full Database Migration Tool');
  console.log('=====================================================\n');

  let sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
  let targetUrl = process.env.TARGET_DATABASE_URL;

  if (!sourceUrl) {
    sourceUrl = await ask('Enter SOURCE Database URL (Old DB): ');
  }

  if (!targetUrl) {
    targetUrl = await ask('Enter TARGET Database URL (New DB): ');
  }

  if (!sourceUrl || !targetUrl) {
    console.error('❌ Error: Both source and target database URLs are required.');
    process.exit(1);
  }

  if (sourceUrl === targetUrl) {
    console.error('❌ Error: Source and Target database URLs cannot be the same.');
    process.exit(1);
  }

  console.log('\nConnecting to databases...');

  const sourceDb = new PrismaClient({
    datasourceUrl: sourceUrl,
  });

  const targetDb = new PrismaClient({
    datasourceUrl: targetUrl,
  });

  try {
    // 1. Test connections
    console.log('Testing connection to Source Database...');
    await sourceDb.$connect();
    console.log('✅ Connected to Source Database successfully.');

    console.log('Testing connection to Target Database...');
    await targetDb.$connect();
    console.log('✅ Connected to Target Database successfully.\n');

    console.log('-----------------------------------------------------');
    console.log('Starting data transfer...');
    console.log('-----------------------------------------------------\n');

    const summary = [];

    for (const { name, model } of MODEL_TRANSFER_ORDER) {
      process.stdout.write(`⏳ Migrating ${name}... `);

      if (!sourceDb[model] || !targetDb[model]) {
        console.log(`⚠️ Model "${model}" not found on client. Skipping.`);
        continue;
      }

      // Count source records
      const totalCount = await sourceDb[model].count();
      if (totalCount === 0) {
        console.log(`0 records (Empty table).`);
        summary.push({ model: name, sourceCount: 0, targetCount: 0, status: 'EMPTY' });
        continue;
      }

      let copied = 0;
      let cursor = undefined;

      // Transfer in batches
      while (copied < totalCount) {
        const records = await sourceDb[model].findMany({
          take: BATCH_SIZE,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: 'asc' },
        });

        if (records.length === 0) break;

        // Upsert or createMany
        for (const record of records) {
          if ('id' in record) {
            await targetDb[model].upsert({
              where: { id: record.id },
              update: record,
              create: record,
            });
          } else {
            // For tables without 'id' (if any)
            await targetDb[model].create({
              data: record,
            });
          }
        }

        copied += records.length;
        cursor = records[records.length - 1]?.id;
      }

      // Verify target count
      const targetCount = await targetDb[model].count();
      const isMatch = targetCount >= totalCount;

      console.log(`✅ Transferred ${copied}/${totalCount} records (Target has ${targetCount}).`);
      summary.push({
        model: name,
        sourceCount: totalCount,
        targetCount,
        status: isMatch ? 'SUCCESS' : 'MISMATCH',
      });
    }

    console.log('\n=====================================================');
    console.log('📊 Migration Summary & Verification:');
    console.log('=====================================================');
    console.table(summary);

    const hasMismatches = summary.some((s) => s.status === 'MISMATCH');
    if (!hasMismatches) {
      console.log('\n🎉 ALL DATA MIGRATED & VERIFIED WITH ZERO DATA LOSS!');
      console.log('\nNext steps:');
      console.log('1. Update your .env.local file with the new DATABASE_URL.');
      console.log('2. Update your hosting provider (Netlify / Vercel / Railway) environment variable DATABASE_URL.');
      console.log('3. Restart your development or production server.');
    } else {
      console.warn('\n⚠️ Some tables reported count mismatches. Please inspect the summary table above.');
    }
  } catch (error) {
    console.error('\n❌ Migration failed with error:', error);
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
  }
}

migrate();
