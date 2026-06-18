import { syncApplicationToLms } from '../lib/api/lms-sync.service';
import { transformApplicationForExternalApi } from '../lib/api/sync.service';
import { prisma } from '../lib/db/prisma';

const applicationIdArg = process.argv[2];

if (!applicationIdArg) {
  console.error('Usage: tsx scripts/resync-one-lms.ts <applicationId>');
  process.exit(1);
}

const applicationId: string = applicationIdArg;

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

async function main() {
  const application = await prisma.application.findUnique({
    where: { applicationId },
    include: applicationInclude,
  });

  if (!application) {
    console.error(`Application not found: ${applicationId}`);
    process.exit(1);
  }

  const payload = await transformApplicationForExternalApi(application);
  const result = await syncApplicationToLms(applicationId, payload);

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
