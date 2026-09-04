import { ApplicationStatus } from '@/generated/prisma';
import { answerAssistiveChat } from '@/lib/assistive-chatbot-faq';
import { getStatusLabel } from '@/lib/constants/application-status';
import { getApplicationById } from '@/lib/data/application';
import { getHybridApplications } from '@/lib/data/applications-hybrid';
import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const APPLY_REPLY =
  'Start or continue a Uwezo loan application:\n' +
  '• New: /apply/create\n' +
  '• Continue: /dashboard\n' +
  'Steps: group-data → members → loan-conditions → proposed-business → member-confirmation → confirmations → review.\n\n' +
  'Reply ID, KRA, or passport then Attach a file for an assistive document check. Official storage still happens on the apply forms.';

function formatAppStatus(status: string | undefined): string {
  if (!status) return 'Unknown';
  try {
    return getStatusLabel(status as ApplicationStatus);
  } catch {
    return status.replace(/_/g, ' ');
  }
}

async function statusLookup(reference: string): Promise<string> {
  const ref = reference.trim();
  if (!ref)
    return 'Send your application ID (APP-YYYYMMDD-XXXXXX) or type “list”.';

  if (/^(list|all|mine)$/i.test(ref)) {
    try {
      const apps = await getHybridApplications();
      const rows = (apps || []).slice(0, 8);
      if (!rows.length) {
        return 'No applications found on your account. Choose Apply for a loan to start.';
      }
      return (
        'Your applications:\n' +
        rows
          .map((a) => {
            const id = a.generalDetails?.applicationId || '—';
            const label = formatAppStatus(a.generalDetails?.status);
            return `• ${id}: ${label}`;
          })
          .join('\n')
      );
    } catch {
      return 'Could not list applications. Open /dashboard or sign in again.';
    }
  }

  try {
    const app = await getApplicationById(ref);
    if (!app?.generalDetails) {
      return 'No application with that ID was found on your account.';
    }
    const id = app.generalDetails.applicationId;
    const label = formatAppStatus(app.generalDetails.status);
    return `Application ${id}: ${label}. Open /dashboard/${id} for details.`;
  } catch {
    return 'Unable to look up that application. Confirm you are signed in and the ID is correct.';
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

  if (action === 'session') {
    return NextResponse.json({ authenticated: Boolean(session) });
  }

  if (action === 'menu') {
    if (!session) {
      return NextResponse.json({
        reply: 'Please sign in first (username/email, then password).',
        needAuth: true,
      });
    }
    return NextResponse.json({
      reply: 'Signed in successfully.\nWhat would you like to do?',
      quickReplies: [
        { id: 'apply', label: '1. Apply for a loan', value: 'apply' },
        {
          id: 'status',
          label: '2. Check status of loan application',
          value: 'status',
        },
      ],
      authenticated: true,
    });
  }

  if (action === 'status') {
    if (!session) {
      return NextResponse.json({
        reply: 'Sign in first to check status on your account.',
        needAuth: true,
      });
    }
    return NextResponse.json({
      reply: await statusLookup(reference),
      source: 'status',
      authenticated: true,
    });
  }

  if (action === 'apply_guide' || /^(1|apply)\b/i.test(message.trim())) {
    return NextResponse.json({
      reply: APPLY_REPLY,
      source: 'apply',
      authenticated: Boolean(session),
      needAuth: !session,
    });
  }

  if (/^(2|status)\b/i.test(message.trim())) {
    return NextResponse.json({
      reply:
        'Send your application ID (APP-…) or type “list”. Lookups are limited to your account.',
      source: 'status_prompt',
      expectReference: true,
      needAuth: !session,
    });
  }

  if (session && /^APP-[\w-]+$/i.test(message.trim())) {
    return NextResponse.json({
      reply: await statusLookup(message.trim()),
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
  });
}
