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
    memberId?: string;
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

const LOAN_MEMBER_WIZARD: FieldDef[] = [
  { key: 'member.fullname', label: 'Member full name', kind: 'text' },
  { key: 'member.nationalIdCode', label: 'National ID number', kind: 'text' },
  { key: 'member.gender', label: 'Gender (Male/Female)', kind: 'text' },
  {
    key: 'member.type',
    label: 'Position / type (e.g. Chairperson)',
    kind: 'text',
  },
  { key: 'member.phoneNumber', label: 'Phone number', kind: 'text' },
];

const MAX_LOAN_STAGE = 7;

function withNextStageChip(
  replies: QuickReply[],
  nextValue: string,
  stage: number,
  maxStage: number,
): QuickReply[] {
  if (stage >= maxStage) return replies;
  return [
    { id: 'next-stage', label: 'Next stage', value: nextValue },
    ...replies.filter((r) => r.id !== 'next-stage'),
  ];
}

function stageAllNonUploadFilled(
  fields: FieldDef[],
  isFilled: (f: FieldDef) => boolean,
): boolean {
  const editable = fields.filter((f) => f.kind !== 'upload');
  if (!editable.length) return false;
  return editable.every(isFilled);
}

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

function memberCol(fieldKey: string): string {
  return fieldKey.replace(/^member\./, '');
}

function isLoanMemberComplete(m: {
  fullname?: string | null;
  nationalIdCode?: string | null;
  gender?: string | null;
  type?: string | null;
  phoneNumber?: string | null;
}): boolean {
  return Boolean(
    m.fullname?.trim() &&
    m.nationalIdCode?.trim() &&
    !m.nationalIdCode.startsWith('DRAFT-') &&
    m.gender &&
    m.type?.trim() &&
    m.phoneNumber?.trim() &&
    m.phoneNumber !== 'pending',
  );
}

function navChips(applicationId: string, href?: string): QuickReply[] {
  const chips: QuickReply[] = [
    {
      id: 'back',
      label: 'Back to stages',
      value: `select_app:${applicationId}`,
    },
  ];
  if (href) {
    chips.push({ id: 'open', label: 'Open full form', value: `open:${href}` });
  }
  chips.push({ id: 'menu', label: 'Back to menu', value: 'menu' });
  return chips;
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

export async function loanMemberPicker(
  applicationId: string,
): Promise<ApplyFlowResult> {
  const app = await loadOwnedApp(applicationId);
  if (!app) {
    return {
      reply: 'Application not found on your account.',
      quickReplies: [{ id: 'menu', label: 'Back to menu', value: 'menu' }],
    };
  }
  const members = app.members || [];
  const completeCount = members.filter(isLoanMemberComplete).length;
  const done = completeCount >= 1;
  const href = `/apply/${applicationId}/members`;

  const lines = [
    'Stage 2: Members. Add or edit members in chat.',
    members.length
      ? members
          .map((m, i) => {
            const mark = isLoanMemberComplete(m) ? '✓' : '○';
            return `${mark} ${i + 1}. ${m.fullname || 'Unnamed'} · ${m.nationalIdCode}`;
          })
          .join('\n')
      : 'No members yet.',
    `Saved members: ${completeCount}.`,
  ];

  const quickReplies: QuickReply[] = [
    {
      id: 'member-add',
      label: 'Add member',
      value: `member:add:loan:${applicationId}`,
    },
  ];
  members.forEach((m, i) => {
    quickReplies.push({
      id: `member-edit-${m.id}`,
      label: `Edit ${i + 1}. ${(m.fullname || 'Member').slice(0, 20)}`,
      value: `member:edit:loan:${applicationId}:${m.id}`,
    });
  });
  quickReplies.push({
    id: 'member-done',
    label: done ? 'Done (advance)' : 'Done (need ≥1 member)',
    value: `member:done:loan:${applicationId}`,
  });
  quickReplies.push(...navChips(applicationId, href));

  return {
    reply: lines.join('\n'),
    quickReplies: done
      ? withNextStageChip(
          quickReplies,
          `stage:${applicationId}:3`,
          2,
          MAX_LOAN_STAGE,
        )
      : quickReplies,
    phase: 'field_pick',
  };
}

function beginLoanMemberField(
  applicationId: string,
  memberId: string | undefined,
  field: FieldDef,
): ApplyFlowResult {
  return {
    reply: `Enter ${field.label}.`,
    quickReplies: [
      {
        id: 'back',
        label: 'Back to members',
        value: `stage:${applicationId}:2`,
      },
      { id: 'menu', label: 'Back to menu', value: 'menu' },
    ],
    phase: 'await_field',
    expectFieldValue: true,
    fieldContext: {
      kind: 'loan',
      appId: applicationId,
      stage: 2,
      field: field.key,
      label: field.label,
      memberId,
    },
  };
}

export async function handleLoanMemberAction(
  action: string,
): Promise<ApplyFlowResult> {
  const addMatch = action.match(/^member:add:loan:(.+)$/i);
  if (addMatch) {
    const applicationId = addMatch[1]!.trim();
    const app = await loadOwnedApp(applicationId);
    if (!app) {
      return {
        reply: 'Application not found.',
        quickReplies: [{ id: 'menu', label: 'Back to menu', value: 'menu' }],
      };
    }
    return beginLoanMemberField(
      applicationId,
      undefined,
      LOAN_MEMBER_WIZARD[0]!,
    );
  }

  const editMatch = action.match(/^member:edit:loan:([^:]+):([a-z0-9-]+)$/i);
  if (editMatch) {
    const applicationId = editMatch[1]!.trim();
    const memberId = editMatch[2]!;
    const app = await loadOwnedApp(applicationId);
    if (!app) {
      return {
        reply: 'Application not found.',
        quickReplies: [{ id: 'menu', label: 'Back to menu', value: 'menu' }],
      };
    }
    const member = app.members.find((m) => m.id === memberId);
    if (!member) return loanMemberPicker(applicationId);
    return beginLoanMemberField(
      applicationId,
      memberId,
      LOAN_MEMBER_WIZARD[0]!,
    );
  }

  const doneMatch = action.match(/^member:done:loan:(.+)$/i);
  if (doneMatch) {
    const applicationId = doneMatch[1]!.trim();
    const app = await loadOwnedApp(applicationId);
    if (!app) {
      return {
        reply: 'Application not found.',
        quickReplies: [{ id: 'menu', label: 'Back to menu', value: 'menu' }],
      };
    }
    const completeCount = (app.members || []).filter(
      isLoanMemberComplete,
    ).length;
    if (completeCount < 1) {
      const again = await loanMemberPicker(applicationId);
      return {
        ...again,
        reply: `Add at least one complete member before continuing.\n\n${again.reply}`,
      };
    }
    await prisma.application.update({
      where: { id: app.id },
      data: {
        applicationProgress: Math.max(app.applicationProgress || 1, 3),
        syncStatus: SyncStatus.PENDING,
      },
    });
    const next = await loanFieldPicker(applicationId, 3);
    return {
      ...next,
      reply: `Members saved (${completeCount}). Progress advanced to stage 3.\n\n${next.reply}`,
    };
  }

  return {
    reply: 'Unknown member action.',
    quickReplies: [{ id: 'menu', label: 'Back to menu', value: 'menu' }],
  };
}

export async function saveLoanMemberField(
  applicationId: string,
  fieldKey: string,
  rawValue: string,
  memberId?: string,
): Promise<ApplyFlowResult> {
  const app = await loadOwnedApp(applicationId);
  if (!app) {
    return {
      reply: 'Application not found.',
      quickReplies: [{ id: 'menu', label: 'Back to menu', value: 'menu' }],
    };
  }
  const value = rawValue.trim();
  if (!value) {
    return {
      reply: 'Please enter a non-empty value.',
      phase: 'await_field',
      expectFieldValue: true,
      fieldContext: {
        kind: 'loan',
        appId: applicationId,
        stage: 2,
        field: fieldKey,
        label: fieldKey,
        memberId,
      },
      quickReplies: [
        {
          id: 'back',
          label: 'Back to members',
          value: `stage:${applicationId}:2`,
        },
      ],
    };
  }

  const col = memberCol(fieldKey);
  const wizardIdx = LOAN_MEMBER_WIZARD.findIndex((f) => f.key === fieldKey);
  if (wizardIdx < 0) return loanMemberPicker(applicationId);

  const natureOfTheGroup =
    app.members.find((m) => m.natureOfTheGroup?.trim())?.natureOfTheGroup ||
    app.groupData?.groupName ||
    'Group';

  try {
    let currentId = memberId;

    if (col === 'gender') {
      const g = value.toLowerCase();
      if (!/^(male|female|m|f)$/i.test(value)) {
        return {
          reply: 'Enter Male or Female.',
          phase: 'await_field',
          expectFieldValue: true,
          fieldContext: {
            kind: 'loan',
            appId: applicationId,
            stage: 2,
            field: fieldKey,
            label: 'Gender (Male/Female)',
            memberId: currentId,
          },
          quickReplies: [
            {
              id: 'back',
              label: 'Back to members',
              value: `stage:${applicationId}:2`,
            },
          ],
        };
      }
    }

    const genderValue =
      col === 'gender'
        ? /^(f|female)$/i.test(value)
          ? 'Female'
          : 'Male'
        : undefined;

    if (!currentId) {
      if (col !== 'fullname') {
        return beginLoanMemberField(
          applicationId,
          undefined,
          LOAN_MEMBER_WIZARD[0]!,
        );
      }
      const created = await prisma.memberData.create({
        data: {
          applicationId: app.id,
          natureOfTheGroup,
          fullname: value,
          nationalIdCode: `DRAFT-${Date.now()}`,
          gender: 'Male',
          type: 'Member',
          phoneNumber: `pending-${Date.now()}`,
          photoOfId: '{}',
        },
      });
      currentId = created.id;
    } else {
      const existing = await prisma.memberData.findFirst({
        where: { id: currentId, applicationId: app.id },
      });
      if (!existing) return loanMemberPicker(applicationId);

      if (col === 'nationalIdCode') {
        const clash = await prisma.memberData.findFirst({
          where: {
            applicationId: app.id,
            nationalIdCode: value,
            NOT: { id: currentId },
          },
        });
        if (clash) {
          return {
            reply: `National ID ${value} is already on this application.`,
            phase: 'await_field',
            expectFieldValue: true,
            fieldContext: {
              kind: 'loan',
              appId: applicationId,
              stage: 2,
              field: fieldKey,
              label: 'National ID number',
              memberId: currentId,
            },
            quickReplies: [
              {
                id: 'back',
                label: 'Back to members',
                value: `stage:${applicationId}:2`,
              },
            ],
          };
        }
        await prisma.memberData.update({
          where: { id: currentId },
          data: { nationalIdCode: value },
        });
      } else if (col === 'gender') {
        await prisma.memberData.update({
          where: { id: currentId },
          data: { gender: genderValue as 'Male' | 'Female' },
        });
      } else if (col === 'phoneNumber') {
        const clash = await prisma.memberData.findFirst({
          where: {
            applicationId: app.id,
            phoneNumber: value,
            NOT: { id: currentId },
          },
        });
        if (clash) {
          return {
            reply: `Phone ${value} is already used by another member.`,
            phase: 'await_field',
            expectFieldValue: true,
            fieldContext: {
              kind: 'loan',
              appId: applicationId,
              stage: 2,
              field: fieldKey,
              label: 'Phone number',
              memberId: currentId,
            },
            quickReplies: [
              {
                id: 'back',
                label: 'Back to members',
                value: `stage:${applicationId}:2`,
              },
            ],
          };
        }
        await prisma.memberData.update({
          where: { id: currentId },
          data: { phoneNumber: value },
        });
      } else {
        await prisma.memberData.update({
          where: { id: currentId },
          data: { [col]: value },
        });
      }
    }

    await prisma.application.update({
      where: { id: app.id },
      data: { syncStatus: SyncStatus.PENDING },
    });

    const nextField = LOAN_MEMBER_WIZARD[wizardIdx + 1];
    if (nextField) {
      return {
        ...beginLoanMemberField(applicationId, currentId, nextField),
        reply: `Saved ${LOAN_MEMBER_WIZARD[wizardIdx]!.label}.\n\nEnter ${nextField.label}.`,
      };
    }

    const list = await loanMemberPicker(applicationId);
    return {
      ...list,
      reply: `Member saved.\n\n${list.reply}`,
    };
  } catch (err) {
    return {
      reply: `Could not save member: ${err instanceof Error ? err.message : 'unknown error'}`,
      quickReplies: [
        {
          id: 'back',
          label: 'Back to members',
          value: `stage:${applicationId}:2`,
        },
        { id: 'menu', label: 'Back to menu', value: 'menu' },
      ],
    };
  }
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

  if (stage === 2) {
    return loanMemberPicker(applicationId);
  }

  const fields = STAGE_FIELDS[stage] || [];

  if (!fields.length) {
    return {
      reply:
        `${step?.title || `Stage ${stage}`} needs the full form (confirmations or review).\n` +
        `Open it to continue, or pick another stage.`,
      quickReplies: [
        {
          id: 'open',
          label: `Open ${step?.title || 'stage'}`,
          value: `open:${href}`,
        },
        ...navChips(applicationId),
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
  let replies = [...quickReplies, ...navChips(applicationId, href)];
  if (
    stageAllNonUploadFilled(fields, (f) =>
      Boolean(readFieldValue(app, stage, f.key)),
    )
  ) {
    replies = withNextStageChip(
      replies,
      `stage:${applicationId}:${stage + 1}`,
      stage,
      MAX_LOAN_STAGE,
    );
  }

  return {
    reply: `Stage ${stage}: ${step?.title}. Tap a field to type a value, or an upload slot to attach a file.`,
    quickReplies: replies,
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
  if (stage === 2 || fieldKey.startsWith('member.')) {
    const field =
      LOAN_MEMBER_WIZARD.find((f) => f.key === fieldKey) ||
      LOAN_MEMBER_WIZARD[0]!;
    return beginLoanMemberField(applicationId, undefined, field);
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
  memberId?: string,
): Promise<ApplyFlowResult> {
  if (stage === 2 || fieldKey.startsWith('member.')) {
    return saveLoanMemberField(applicationId, fieldKey, rawValue, memberId);
  }

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
    return {
      ...again,
      reply: `Saved ${field.label}.\n\n${again.reply}`,
      quickReplies: withNextStageChip(
        again.quickReplies,
        `stage:${applicationId}:${stage + 1}`,
        stage,
        MAX_LOAN_STAGE,
      ),
    };
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
