import { writeFileSync } from 'fs';

import { transformApplicationForExternalApi } from '../lib/api/sync.service';
import { prisma } from '../lib/db/prisma';

const applicationIdArg = process.argv[2];
const outputPathArg = process.argv[3];

if (!applicationIdArg || !outputPathArg) {
  console.error(
    'Usage: tsx scripts/export-lms-payload.ts <applicationId> <outputPath>',
  );
  process.exit(1);
}

const applicationId: string = applicationIdArg;
const outputPath: string = outputPathArg;

async function main() {
  const applicationInclude = {
    user: true,
    groupData: true,
    members: true,
    loanConditions: true,
    proposedBusiness: {
      include: {
        customExpenses: true,
      },
    },
    confirmations: true,
  } as const;

  const application = await prisma.application.findUnique({
    where: { applicationId },
    include: applicationInclude,
  });

  if (!application) {
    throw new Error(`Application not found: ${applicationId}`);
  }

  const payload = await transformApplicationForExternalApi(application);
  writeFileSync(outputPath, JSON.stringify(payload));
  console.log(
    `Wrote ${outputPath} (${Buffer.byteLength(JSON.stringify(payload))} bytes)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
