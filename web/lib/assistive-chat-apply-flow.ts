import { ApplicationStatus, SyncStatus } from '@/generated/prisma';
import { getApplicationById, getCurrentUser } from '@/lib/data/application';
import { getHybridApplications } from '@/lib/data/applications-hybrid';
import { prisma } from '@/lib/db/prisma';

export type QuickReply = { id: string; label: string; value: string };

export type ApplyFlowResult = {
  reply: string;
  quickReplies: QuickReply[];
  phase?: string;
  openUrl?: string;
  expectFieldValue?: boolean;
  expectUpload?: boolean;
  fieldContext?: {
    kind: 'loan';
    appId: string;
    stage: number;
    field: string;
    label: string;
    uploadCategory?: string;
  };
};

const APPLY_STEPS = [
  { index: 1, title: 'Group data', path: '/group-data' },
  { index: 2, title: 'Members', path: '/members' },
  { index: 3, title: 'Loan conditions', path: '/loan-conditions' },
  { index: 4, title: 'Proposed business', path: '/proposed-business' },
  { index: 5, title: 'Member confirmation', path: '/member-confirmation' },
  { index: 6, title: 'Confirmations', path: '/confirmations' },
  { index: 7, title: 'Review & submit', path: '/review' },
] as const;

type FieldDef = {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'date' | 'upload';
  column?: string;
};

const STAGE_FIELDS: Record<number, FieldDef[]> = {
  1: [
    {
      key: 'groupName',
      label: 'Group name',
      kind: 'text',
      column: 'groupName',
    },
    {
      key: 'groupRegistrationNumber',
      label: 'Registration number',
      kind: 'text',
      column: 'groupRegistrationNumber',
    },
    {
      key: 'dateFormed',
      label: 'Date formed (YYYY-MM-DD)',
      kind: 'date',
      column: 'dateFormed',
    },
    {
      key: 'countyOfOperation',
      label: 'County of operation',
      kind: 'text',
      column: 'countyOfOperation',
    },
    {
      key: 'constituency',
      label: 'Constituency',
      kind: 'text',
      column: 'constituency',
    },
    { key: 'ward', label: 'Ward', kind: 'text', column: 'ward' },
    {
      key: 'meetingPoint',
      label: 'Meeting point',
      kind: 'text',
      column: 'meetingPoint',
    },
    {
      key: 'nearestLandmark',
      label: 'Nearest landmark',
      kind: 'text',
      column: 'nearestLandmark',
    },
    {
      key: 'purposeOfTheGroup',
      label: 'Purpose of the group',
      kind: 'text',
      column: 'purposeOfTheGroup',
    },
    {
      key: 'keyActivitiesOfTheGroup',
      label: 'Key activities',
      kind: 'text',
      column: 'keyActivitiesOfTheGroup',
    },
    {
      key: 'groupRegistrationCertificate',
      label: 'Group registration certificate',
      kind: 'upload',
      column: 'groupRegistrationCertificate',
    },
    {
      key: 'listOfMembersOnCertificate',
      label: 'List of members on certificate',
      kind: 'upload',
      column: 'listOfMembersOnCertificate',
    },
    {
      key: 'groupMeetingMinutes',
      label: 'Group meeting minutes',
      kind: 'upload',
      column: 'groupMeetingMinutes',
    },
  ],
  2: [],
  3: [
    { key: 'loanType', label: 'Loan type', kind: 'text', column: 'loanType' },
    {
      key: 'loanAmount',
      label: 'Loan amount (KES)',
      kind: 'number',
      column: 'loanAmount',
    },
    {
      key: 'repaymentPeriod',
      label: 'Repayment period (months)',
      kind: 'number',
      column: 'repaymentPeriod',
    },
    {
      key: 'bankName',
      label: 'Bank / SACCO name',
      kind: 'text',
      column: 'bankName',
    },
    { key: 'bankBranch', label: 'Branch', kind: 'text', column: 'bankBranch' },
    {
      key: 'accountNumber',
      label: 'Account number',
      kind: 'text',
      column: 'accountNumber',
    },
    {
      key: 'institutionType',
      label: 'Institution type (bank/sacco)',
      kind: 'text',
      column: 'institutionType',
    },
  ],
  4: [
    {
      key: 'natureOfBusiness',
      label: 'Nature of business',
      kind: 'text',
      column: 'natureOfBusiness',
    },
    {
      key: 'yearsInBusiness',
      label: 'Years in business',
      kind: 'number',
      column: 'yearsInBusiness',
    },
    {
      key: 'averageIncome',
      label: 'Average income',
      kind: 'number',
      column: 'averageIncome',
    },
    {
      key: 'costOfGoods',
      label: 'Cost of goods',
      kind: 'number',
      column: 'costOfGoods',
    },
    { key: 'salaries', label: 'Salaries', kind: 'number', column: 'salaries' },
    {
      key: 'rentForBusiness',
      label: 'Rent for business',
      kind: 'number',
      column: 'rentForBusiness',
    },
    {
      key: 'transportForBusinessStock',
      label: 'Transport for stock',
      kind: 'number',
      column: 'transportForBusinessStock',
    },
  ],
  5: [],
  6: [],
  7: [],
};

function stageChipLabel(
  index: number,
  title: string,
  progress: number,
): string {
  const done = index < progress;
  const current = index === progress;
  const mark = done ? '✓' : current ? '▶' : '○';
  return `${mark} ${index}. ${title}${current ? ' (next)' : done ? ' (edit)' : ''}`;
}

async function loadOwnedApp(applicationId: string) {
  const user = await getCurrentUser();
  const app = await prisma.application.findUnique({
    where: { applicationId },
    include: {
      groupData: true,
      loanConditions: true,
      proposedBusiness: true,
      members: true,
    },
  });
  if (!app || app.userId !== user.id) return null;
  return app;
}

function emptyJson(): string {
  return '{}';
}

function emptyArrayJson(): string {
  return '[]';
}

export async function loanStagePicker(
  applicationId: string,
): Promise<ApplyFlowResult> {
  const app = await loadOwnedApp(applicationId);
  if (!app) {
    return {
      reply: 'That application was not found on your account.',
      quickReplies: [{ id: 'menu', label: 'Back to menu', value: 'menu' }],
    };
  }
  const progress = Math.max(1, app.applicationProgress || 1);
  const name = app.groupData?.groupName?.trim() || 'Loan application';
  const ordered = [...APPLY_STEPS].sort((a, b) => {
    const aInc = a.index >= progress ? 0 : 1;
    const bInc = b.index >= progress ? 0 : 1;
    if (aInc !== bInc) return aInc - bInc;
    return a.index - b.index;
  });
  const quickReplies: QuickReply[] = ordered.map((s) => ({
    id: `stage-${s.index}`,
    label: stageChipLabel(s.index, s.title, progress),
    value: `stage:${applicationId}:${s.index}`,
  }));
  const nextPath =
    APPLY_STEPS[Math.min(progress, APPLY_STEPS.length) - 1]?.path ||
    '/group-data';
  quickReplies.push(
    {
      id: 'open-next',
      label: 'Open next stage in form',
      value: `open:/apply/${applicationId}${nextPath}`,
    },
    { id: 'menu', label: 'Back to menu', value: 'menu' },
  );
  return {
    reply:
      `${name} (${applicationId}). Tap a stage to edit fields in chat.\n` +
      `Incomplete stages first (▶ = next). Completed stages stay available to rectify.`,
    quickReplies,
    phase: 'stage_pick',
  };
}

function readFieldValue(
  app: NonNullable<Awaited<ReturnType<typeof loadOwnedApp>>>,
  stage: number,
  key: string,
): string | null {
  if (stage === 1 && app.groupData) {
    const gd = app.groupData as Record<string, unknown>;
    const v = gd[key];
    if (v == null) return null;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
      try {
        const parsed = JSON.parse(v) as
          | { filename?: string; url?: string }
          | unknown[];
        if (Array.isArray(parsed))
          return parsed.length ? `${parsed.length} file(s)` : null;
        if (
          parsed &&
          typeof parsed === 'object' &&
          ('filename' in parsed || 'url' in parsed)
        ) {
          return (parsed as { filename?: string }).filename || 'uploaded';
        }
      } catch {
        /* plain */
      }
    }
    const s = String(v).trim();
    return s && s !== '{}' && s !== '[]' ? s : null;
  }
  if (stage === 3 && app.loanConditions) {
    const v = (app.loanConditions as Record<string, unknown>)[key];
    return v == null ? null : String(v);
  }
  if (stage === 4 && app.proposedBusiness) {
    const v = (app.proposedBusiness as Record<string, unknown>)[key];
    return v == null ? null : String(v);
  }
  return null;
}

export async function loanFieldPicker(
  applicationId: string,
  stage: number,
): Promise<ApplyFlowResult> {
  const app = await loadOwnedApp(applicationId);
  if (!app) {
    return {
      reply: 'Application not found on your account.',
      quickReplies: [{ id: 'menu', label: 'Back to menu', value: 'menu' }],
    };
  }
  const step = APPLY_STEPS.find((s) => s.index === stage);
  const href = `/apply/${applicationId}${step?.path || '/group-data'}`;
  const fields = STAGE_FIELDS[stage] || [];

  if (!fields.length) {
    return {
      reply:
        `${step?.title || `Stage ${stage}`} needs the full form (members, confirmations, or review).\n` +
        `Open it to continue, or pick another stage.`,
      quickReplies: [
        {
          id: 'open',
          label: `Open ${step?.title || 'stage'}`,
          value: `open:${href}`,
        },
        {
          id: 'back',
          label: 'Back to stages',
          value: `select_app:${applicationId}`,
        },
        { id: 'menu', label: 'Back to menu', value: 'menu' },
      ],
      phase: 'field_pick',
    };
  }

  const quickReplies: QuickReply[] = fields.map((f) => {
    const cur = readFieldValue(app, stage, f.key);
    const filled = Boolean(cur);
    const mark =
      f.kind === 'upload' ? (filled ? '📎✓' : '📎') : filled ? '✓' : '○';
    return {
      id: `f-${f.key}`,
      label: `${mark} ${f.label}${filled && f.kind !== 'upload' ? ` · ${String(cur).slice(0, 22)}` : ''}`,
      value: `field:${applicationId}:${stage}:${f.key}`,
    };
  });
  quickReplies.push(
    {
      id: 'back',
      label: 'Back to stages',
      value: `select_app:${applicationId}`,
    },
    { id: 'open', label: 'Open full form', value: `open:${href}` },
    { id: 'menu', label: 'Back to menu', value: 'menu' },
  );

  return {
    reply: `Stage ${stage}: ${step?.title}. Tap a field to type a value, or an upload slot to attach a file.`,
    quickReplies,
    phase: 'field_pick',
  };
}

export async function beginLoanFieldEdit(
  applicationId: string,
  stage: number,
  fieldKey: string,
): Promise<ApplyFlowResult> {
  const app = await loadOwnedApp(applicationId);
  if (!app) {
    return {
      reply: 'Application not found.',
      quickReplies: [{ id: 'menu', label: 'Back to menu', value: 'menu' }],
    };
  }
  const field = (STAGE_FIELDS[stage] || []).find((f) => f.key === fieldKey);
  if (!field) {
    return loanFieldPicker(applicationId, stage);
  }
  if (field.kind === 'upload') {
    return {
      reply: `Attach ${field.label} using the upload control below. The file is authenticity-checked then saved on this application.`,
      quickReplies: [
        {
          id: 'back',
          label: 'Back to fields',
          value: `stage:${applicationId}:${stage}`,
        },
        { id: 'menu', label: 'Back to menu', value: 'menu' },
      ],
      phase: 'await_upload',
      expectUpload: true,
      fieldContext: {
        kind: 'loan',
        appId: applicationId,
        stage,
        field: field.key,
        label: field.label,
        uploadCategory: field.column || field.key,
      },
    };
  }
  const cur = readFieldValue(app, stage, field.key);
  return {
    reply: `Enter ${field.label}` + (cur ? ` (current: ${cur}).` : '.'),
    quickReplies: [
      {
        id: 'back',
        label: 'Back to fields',
        value: `stage:${applicationId}:${stage}`,
      },
      { id: 'menu', label: 'Back to menu', value: 'menu' },
    ],
    phase: 'await_field',
    expectFieldValue: true,
    fieldContext: {
      kind: 'loan',
      appId: applicationId,
      stage,
      field: field.key,
      label: field.label,
    },
  };
}

async function bumpProgress(
  internalId: string,
  current: number,
  stage: number,
) {
  const target = Math.max(current || 1, stage);
  if (target > (current || 1)) {
    await prisma.application.update({
      where: { id: internalId },
      data: { applicationProgress: target, syncStatus: SyncStatus.PENDING },
    });
  }
}

export async function saveLoanField(
  applicationId: string,
  stage: number,
  fieldKey: string,
  rawValue: string,
): Promise<ApplyFlowResult> {
  const app = await loadOwnedApp(applicationId);
  if (!app) {
    return {
      reply: 'Application not found.',
      quickReplies: [{ id: 'menu', label: 'Back to menu', value: 'menu' }],
    };
  }
  const field = (STAGE_FIELDS[stage] || []).find((f) => f.key === fieldKey);
  if (!field || field.kind === 'upload') {
    return loanFieldPicker(applicationId, stage);
  }
  const value = rawValue.trim();
  if (!value) {
    return {
      reply: 'Please enter a non-empty value.',
      quickReplies: [
        {
          id: 'retry',
          label: 'Try again',
          value: `field:${applicationId}:${stage}:${fieldKey}`,
        },
      ],
      phase: 'await_field',
      expectFieldValue: true,
      fieldContext: {
        kind: 'loan',
        appId: applicationId,
        stage,
        field: fieldKey,
        label: field.label,
      },
    };
  }

  try {
    if (stage === 1) {
      const data: Record<string, unknown> = {};
      if (field.kind === 'date') {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) {
          return {
            reply: 'Use date format YYYY-MM-DD.',
            quickReplies: [
              {
                id: 'retry',
                label: 'Try again',
                value: `field:${applicationId}:${stage}:${fieldKey}`,
              },
            ],
            phase: 'await_field',
            expectFieldValue: true,
            fieldContext: {
              kind: 'loan',
              appId: applicationId,
              stage,
              field: fieldKey,
              label: field.label,
            },
          };
        }
        data[field.column || field.key] = d;
      } else {
        data[field.column || field.key] = value;
      }

      if (app.groupData) {
        await prisma.groupData.update({
          where: { id: app.groupData.id },
          data,
        });
      } else {
        await prisma.groupData.create({
          data: {
            applicationId: app.id,
            groupName: fieldKey === 'groupName' ? value : 'Group',
            groupRegistrationNumber:
              fieldKey === 'groupRegistrationNumber' ? value : 'TBD',
            dateFormed:
              fieldKey === 'dateFormed'
                ? (data.dateFormed as Date)
                : new Date(),
            groupRegistrationCertificate: emptyJson(),
            listOfMembersOnCertificate: emptyJson(),
            groupMeetingMinutes: emptyArrayJson(),
            purposeOfTheGroup:
              fieldKey === 'purposeOfTheGroup' ? value : emptyJson(),
            keyActivitiesOfTheGroup:
              fieldKey === 'keyActivitiesOfTheGroup' ? value : emptyJson(),
            groupCreditHistory: emptyArrayJson(),
            countyOfOperation: fieldKey === 'countyOfOperation' ? value : '',
            constituency: fieldKey === 'constituency' ? value : '',
            ward: fieldKey === 'ward' ? value : '',
            meetingPoint: fieldKey === 'meetingPoint' ? value : '',
            nearestLandmark: fieldKey === 'nearestLandmark' ? value : '',
            ...data,
          },
        });
      }
      await bumpProgress(app.id, app.applicationProgress, 1);
    } else if (stage === 3) {
      const col = field.column || field.key;
      let parsed: string | number = value;
      if (field.kind === 'number') {
        const n = Number(value);
        if (!Number.isFinite(n)) {
          return {
            reply: 'Enter a valid number.',
            quickReplies: [
              {
                id: 'retry',
                label: 'Try again',
                value: `field:${applicationId}:${stage}:${fieldKey}`,
              },
            ],
            phase: 'await_field',
            expectFieldValue: true,
            fieldContext: {
              kind: 'loan',
              appId: applicationId,
              stage,
              field: fieldKey,
              label: field.label,
            },
          };
        }
        parsed = n;
      }
      if (app.loanConditions) {
        await prisma.loanConditions.update({
          where: { id: app.loanConditions.id },
          data: { [col]: parsed },
        });
      } else {
        await prisma.loanConditions.create({
          data: {
            applicationId: app.id,
            loanType: col === 'loanType' ? String(parsed) : 'GROUP',
            loanAmount: col === 'loanAmount' ? Number(parsed) : 0,
            repaymentPeriod: col === 'repaymentPeriod' ? Number(parsed) : 12,
            bankName: col === 'bankName' ? String(parsed) : '',
            bankBranch: col === 'bankBranch' ? String(parsed) : '',
            accountNumber: col === 'accountNumber' ? String(parsed) : '',
            institutionType:
              col === 'institutionType' ? String(parsed) : 'bank',
            [col]: parsed,
          },
        });
      }
      await bumpProgress(app.id, app.applicationProgress, 3);
    } else if (stage === 4) {
      const col = field.column || field.key;
      let parsed: string | number = value;
      if (field.kind === 'number') {
        const n = Number(value);
        if (!Number.isFinite(n)) {
          return {
            reply: 'Enter a valid number.',
            quickReplies: [
              {
                id: 'retry',
                label: 'Try again',
                value: `field:${applicationId}:${stage}:${fieldKey}`,
              },
            ],
            phase: 'await_field',
            expectFieldValue: true,
            fieldContext: {
              kind: 'loan',
              appId: applicationId,
              stage,
              field: fieldKey,
              label: field.label,
            },
          };
        }
        parsed = n;
      }
      if (app.proposedBusiness) {
        await prisma.proposedBusiness.update({
          where: { id: app.proposedBusiness.id },
          data: { [col]: parsed },
        });
      } else {
        await prisma.proposedBusiness.create({
          data: {
            applicationId: app.id,
            natureOfBusiness: col === 'natureOfBusiness' ? String(parsed) : '',
            yearsInBusiness: col === 'yearsInBusiness' ? Number(parsed) : 0,
            averageIncome: col === 'averageIncome' ? Number(parsed) : 0,
            costOfGoods: col === 'costOfGoods' ? Number(parsed) : 0,
            salaries: col === 'salaries' ? Number(parsed) : 0,
            rentForBusiness: col === 'rentForBusiness' ? Number(parsed) : 0,
            transportForBusinessStock:
              col === 'transportForBusinessStock' ? Number(parsed) : 0,
            businessType: '[]',
            [col]: parsed,
          },
        });
      }
      await bumpProgress(app.id, app.applicationProgress, 4);
    } else {
      return {
        reply: 'Open the full form for this stage.',
        quickReplies: [
          {
            id: 'open',
            label: 'Open form',
            value: `open:/apply/${applicationId}${APPLY_STEPS[stage - 1]?.path || ''}`,
          },
          { id: 'menu', label: 'Back to menu', value: 'menu' },
        ],
      };
    }

    const again = await loanFieldPicker(applicationId, stage);
    return { ...again, reply: `Saved ${field.label}.\n\n${again.reply}` };
  } catch (err) {
    return {
      reply: `Could not save: ${err instanceof Error ? err.message : 'unknown error'}`,
      quickReplies: [
        {
          id: 'back',
          label: 'Back to stages',
          value: `select_app:${applicationId}`,
        },
        { id: 'menu', label: 'Back to menu', value: 'menu' },
      ],
    };
  }
}

export async function saveLoanUploadMeta(
  applicationId: string,
  column: string,
  fileMeta: {
    fid: string;
    filename: string;
    url: string;
    size: number;
    type: string;
  },
): Promise<void> {
  const app = await loadOwnedApp(applicationId);
  if (!app) throw new Error('Application not found');
  const json = JSON.stringify(fileMeta);
  const data =
    column === 'groupMeetingMinutes' || column === 'groupCreditHistory'
      ? { [column]: JSON.stringify([fileMeta]) }
      : { [column]: json };

  if (app.groupData) {
    await prisma.groupData.update({
      where: { id: app.groupData.id },
      data,
    });
  } else {
    await prisma.groupData.create({
      data: {
        applicationId: app.id,
        groupName: 'Group',
        groupRegistrationNumber: 'TBD',
        dateFormed: new Date(),
        groupRegistrationCertificate:
          column === 'groupRegistrationCertificate' ? json : emptyJson(),
        listOfMembersOnCertificate:
          column === 'listOfMembersOnCertificate' ? json : emptyJson(),
        groupMeetingMinutes:
          column === 'groupMeetingMinutes'
            ? JSON.stringify([fileMeta])
            : emptyArrayJson(),
        purposeOfTheGroup: emptyJson(),
        keyActivitiesOfTheGroup: emptyJson(),
        groupCreditHistory:
          column === 'groupCreditHistory'
            ? JSON.stringify([fileMeta])
            : emptyArrayJson(),
        countyOfOperation: '',
        constituency: '',
        ward: '',
        meetingPoint: '',
        nearestLandmark: '',
        ...data,
      },
    });
  }
  await bumpProgress(app.id, app.applicationProgress, 1);
}

export {
  APPLY_STEPS,
  getApplicationById,
  getHybridApplications,
  ApplicationStatus,
};
