import { ApplicationStatus } from '@/generated/prisma';
import { answerAssistiveChat } from '@/lib/assistive-chatbot-faq';
import { getStatusLabel } from '@/lib/constants/application-status';
import { getApplicationById } from '@/lib/data/application';
import { getHybridApplications } from '@/lib/data/applications-hybrid';
import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type QuickReply = { id: string; label: string; value: string };

const APPLY_STEPS = [
  '/group-data',
  '/members',
  '/loan-conditions',
  '/proposed-business',
  '/member-confirmation',
  '/confirmations',
  '/review',
] as const;

const MAIN_MENU: QuickReply[] = [
  { id: 'apply', label: '1. Apply for a loan', value: 'apply' },
  {
    id: 'status',
    label: '2. Check status of loan application',
    value: 'status',
  },
];

const APPLY_REPLY =
  'Start or continue a Uwezo loan application:\n' +
  '• New: /apply/create\n' +
  '• Continue: pick an application below or open /dashboard\n' +
  'Steps: group-data → members → loan-conditions → proposed-business → member-confirmation → confirmations → review.\n\n' +
  'Reply ID, KRA, or passport then Attach a file for an assistive document check.';

function formatAppStatus(status: string | undefined): string {
  if (!status) return 'Unknown';
  try {
    return getStatusLabel(status as ApplicationStatus);
  } catch {
    return status.replace(/_/g, ' ');
  }
}

function isDraftStatus(status: string | undefined): boolean {
  if (!status) return true;
  return (
    status === ApplicationStatus.DRAFT ||
    status === ApplicationStatus.UNSUBMITTED ||
    status === 'DRAFT' ||
    status === 'UNSUBMITTED' ||
    status.toLowerCase() === 'draft' ||
    status.toLowerCase() === 'not started'
  );
}

function continueHref(
  applicationId: string,
  progress: number | undefined,
  status: string | undefined,
): string {
  if (
    !isDraftStatus(status) &&
    status !== ApplicationStatus.GROUP_MEMBER_CONFIRMATION
  ) {
    return `/dashboard/${applicationId}`;
  }
  const stepIndex = Math.max(
    0,
    Math.min((progress || 1) - 1, APPLY_STEPS.length - 1),
  );
  return `/apply/${applicationId}${APPLY_STEPS[stepIndex]}`;
}

function appChipLabel(a: {
  generalDetails?: {
    applicationId?: string;
    status?: string;
    applicationProgress?: number;
  };
  groupData?: { basics?: { groupName?: string } };
}): string {
  const id = a.generalDetails?.applicationId || '—';
  const name = a.groupData?.basics?.groupName?.trim() || 'Loan application';
  const status = formatAppStatus(a.generalDetails?.status);
  const progress = a.generalDetails?.applicationProgress;
  const stage =
    isDraftStatus(a.generalDetails?.status) && progress
      ? `step ${progress}/7`
      : status;
  return `${name} · ${id} · ${stage}`;
}

async function listApplications(mode: 'continue' | 'status'): Promise<{
  reply: string;
  quickReplies: QuickReply[];
}> {
  try {
    const apps = await getHybridApplications();
    const rows = (apps || []).slice(0, 8);
    if (!rows.length) {
      return {
        reply:
          'No applications found on your account. Choose Apply for a loan to start.',
        quickReplies: [
          ...MAIN_MENU,
          {
            id: 'create',
            label: 'Start new application',
            value: 'open:/apply/create',
          },
        ],
      };
    }

    const quickReplies: QuickReply[] = rows.map((a, i) => {
      const id = a.generalDetails?.applicationId || `row-${i}`;
      const status = a.generalDetails?.status;
      const progress = a.generalDetails?.applicationProgress;
      const label = `${i + 1}. ${appChipLabel(a)}`;
      if (mode === 'continue' || isDraftStatus(status)) {
        const href = continueHref(id, progress, status);
        return {
          id: `app-${id}`,
          label,
          value: `open:${href}`,
        };
      }
      return {
        id: `st-${id}`,
        label,
        value: `status_ref:${id}`,
      };
    });

    quickReplies.push({ id: 'menu', label: 'Back to menu', value: 'menu' });

    return {
      reply:
        mode === 'continue'
          ? 'Tap an application to continue (opens the next step or dashboard):'
          : 'Tap an application to view status (drafts open the apply form):',
      quickReplies,
    };
  } catch {
    return {
      reply: 'Could not list applications. Open /dashboard or sign in again.',
      quickReplies: MAIN_MENU,
    };
  }
}

async function statusLookup(reference: string): Promise<{
  reply: string;
  quickReplies?: QuickReply[];
  openUrl?: string;
  navigate?: boolean;
}> {
  const ref = reference.trim();
  if (!ref) {
    return {
      reply: 'Send your application ID (APP-YYYYMMDD-XXXXXX) or tap List.',
      quickReplies: [
        { id: 'list', label: 'List my applications', value: 'list' },
        { id: 'menu', label: 'Back to menu', value: 'menu' },
      ],
    };
  }

  if (/^(list|all|mine)$/i.test(ref)) {
    return listApplications('status');
  }

  try {
    const app = await getApplicationById(ref);
    if (!app?.generalDetails) {
      return {
        reply: 'No application with that ID was found on your account.',
        quickReplies: [
          { id: 'list', label: 'List my applications', value: 'list' },
          { id: 'menu', label: 'Back to menu', value: 'menu' },
        ],
      };
    }
    const id = app.generalDetails.applicationId;
    const label = formatAppStatus(app.generalDetails.status);
    const href = continueHref(
      id,
      app.generalDetails.applicationProgress,
      app.generalDetails.status,
    );
    const name = app.groupData?.basics?.groupName?.trim() || 'Application';
    return {
      reply: `${name} (${id}): ${label}.`,
      openUrl: href,
      quickReplies: [
        {
          id: 'open',
          label: isDraftStatus(app.generalDetails.status)
            ? 'Continue this application'
            : 'Open dashboard',
          value: `open:${href}`,
        },
        { id: 'menu', label: 'Back to menu', value: 'menu' },
      ],
    };
  } catch {
    return {
      reply:
        'Unable to look up that application. Confirm you are signed in and the ID is correct.',
      quickReplies: MAIN_MENU,
    };
  }
}

export async function POST(request: Request) {
  let message = '';
  let path = '';
  let action = 'auto';
  let reference = '';
  try {
    const body = (await request.json()) as {
      message?: string;
      path?: string;
      action?: string;
      reference?: string;
    };
    message = String(body.message || '');
    path = String(body.path || '');
    action = String(body.action || 'auto');
    reference = String(body.reference || message || '');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const session = await getSession();
  const trimmed = message.trim();

  if (action === 'session') {
    return NextResponse.json({ authenticated: Boolean(session) });
  }

  if (action === 'menu' || /^menu$/i.test(trimmed)) {
    if (!session) {
      return NextResponse.json({
        reply: 'Please sign in first (username/email, then password).',
        needAuth: true,
      });
    }
    return NextResponse.json({
      reply: 'Signed in successfully.\nWhat would you like to do?',
      quickReplies: MAIN_MENU,
      authenticated: true,
    });
  }

  if (action === 'list_continue' || /^continue_app$/i.test(trimmed)) {
    if (!session) {
      return NextResponse.json({
        reply: 'Sign in first.',
        needAuth: true,
      });
    }
    const payload = await listApplications('continue');
    return NextResponse.json({
      ...payload,
      source: 'list_continue',
      authenticated: true,
      phase: 'apply_docs',
    });
  }

  if (
    action === 'status' ||
    action.startsWith('status_ref:') ||
    /^status_ref:/i.test(trimmed) ||
    /^list$/i.test(trimmed)
  ) {
    if (!session) {
      return NextResponse.json({
        reply: 'Sign in first to check status on your account.',
        needAuth: true,
      });
    }
    let ref = reference;
    if (action.startsWith('status_ref:'))
      ref = action.slice('status_ref:'.length);
    else if (/^status_ref:/i.test(trimmed))
      ref = trimmed.slice('status_ref:'.length);
    else if (
      /^list$/i.test(trimmed) ||
      (action === 'status' && /^(status|2|list)?$/i.test(ref))
    ) {
      if (/^(status|2)?$/i.test(ref.trim()) || !ref.trim()) {
        return NextResponse.json({
          reply:
            'Send your application ID (APP-…) or tap List. Lookups are limited to your account.',
          expectReference: true,
          quickReplies: [
            { id: 'list', label: 'List my applications', value: 'list' },
            { id: 'menu', label: 'Back to menu', value: 'menu' },
          ],
          authenticated: true,
        });
      }
    }
    if (/^list$/i.test(trimmed)) ref = 'list';

    const result = await statusLookup(ref.trim() || 'list');
    return NextResponse.json({
      ...result,
      source: 'status',
      authenticated: true,
    });
  }

  if (action === 'apply_guide' || /^(1|apply)\b/i.test(trimmed)) {
    return NextResponse.json({
      reply: APPLY_REPLY,
      source: 'apply',
      authenticated: Boolean(session),
      needAuth: !session,
      quickReplies: session
        ? [
            {
              id: 'continue',
              label: '1. Continue existing application',
              value: 'continue_app',
            },
            {
              id: 'new',
              label: '2. Start new Group Application',
              value: 'new_app',
            },
            { id: 'menu', label: 'Back to menu', value: 'menu' },
          ]
        : [],
    });
  }

  if (/^(2|status)\b/i.test(trimmed)) {
    return NextResponse.json({
      reply:
        'Send your application ID (APP-…) or tap List. Lookups are limited to your account.',
      source: 'status_prompt',
      expectReference: true,
      needAuth: !session,
      quickReplies: [
        { id: 'list', label: 'List my applications', value: 'list' },
        { id: 'menu', label: 'Back to menu', value: 'menu' },
      ],
    });
  }

  if (session && /^APP-[\w-]+$/i.test(trimmed)) {
    const result = await statusLookup(trimmed);
    return NextResponse.json({
      ...result,
      source: 'status',
      authenticated: true,
    });
  }

  const llmUrl = process.env.CHATBOT_LLM_API_URL;
  const llmKey = process.env.CHATBOT_LLM_API_KEY;
  if (llmUrl && llmKey) {
    try {
      const res = await fetch(llmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${llmKey}`,
        },
        body: JSON.stringify({
          message,
          path,
          product: 'loans',
          authenticated: Boolean(session),
          system:
            'Assistive Uwezo Loans helper. Never request or repeat passwords. Guide apply and status only.',
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { reply?: string; content?: string };
        const reply = data.reply || data.content;
        if (reply) return NextResponse.json({ reply, source: 'llm' });
      }
    } catch {
      /* FAQ */
    }
  }

  return NextResponse.json({
    reply: answerAssistiveChat(message),
    source: 'faq',
    authenticated: Boolean(session),
    quickReplies: session ? MAIN_MENU : [],
  });
}
