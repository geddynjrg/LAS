/**
 * Rule-based FAQ for the assistive chatbot.
 * Extension point: swap `answerAssistiveChat` for an LLM provider when CHATBOT_LLM_API_KEY is set.
 */

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type FaqEntry = {
  id: string;
  keywords: string[];
  answer: string;
};

export const ASSISTIVE_FAQ: FaqEntry[] = [
  {
    id: 'terms',
    keywords: [
      'term',
      'interest',
      'repay',
      'condition',
      'eligibility',
      'qualify',
    ],
    answer:
      'Uwezo Loans loans support Kenyan workers preparing for overseas employment. Eligibility typically requires group membership, complete identity documents, and meeting age/membership rules. Exact interest and repayment terms appear on your loan offer and tripartite forms — review those before signing. This assistant is advisory only.',
  },
  {
    id: 'documents',
    keywords: [
      'document',
      'upload',
      'passport',
      'id',
      'kra',
      'scan',
      'file',
      'photo',
    ],
    answer:
      'Upload clear colour scans or photos of required documents (National ID or passport, KRA PIN, bank evidence, guarantor forms). Prefer PDF or JPEG under the size limit shown on each upload field. Avoid blurred or cropped edges. If upload fails, check file size and try again on a stable connection.',
  },
  {
    id: 'status',
    keywords: [
      'status',
      'progress',
      'where',
      'stage',
      'vetting',
      'approved',
      'pending',
    ],
    answer:
      'After group and individual submission, officers review your file (constituency → HQ → accounts → attestation → offer). Open My applications / your individual dashboard for the latest status wording. SMS alerts may also notify you at key milestones when configured.',
  },
  {
    id: 'visa-training',
    keywords: [
      'visa',
      'training',
      'flight',
      'destination',
      'pre-departure',
      'agency',
    ],
    answer:
      'Labour-export steps usually include: confirm destination and agency details, complete pre-departure training modules assigned by officers, assemble visa/passport paperwork, and plan flight logistics only after loan offer and compliance clearances. Follow officer guidance — do not book non-refundable travel until instructed.',
  },
  {
    id: 'disbursement',
    keywords: ['disburse', 'payment', 'money', 'bank', 'pesa', 'funds'],
    answer:
      'Disbursement follows successful vetting, required training/attestation, and bank verification. Ensure your bank account details match your ID name. You may receive an SMS when disbursement processing starts.',
  },
  {
    id: 'consent-privacy',
    keywords: ['consent', 'privacy', 'data', 'dpa', 'gdpr', 'retain'],
    answer:
      'Uwezo Fund collects identity, contact, documents, financial, and group/recruitment data to process loans and meet legal duties. Data is kept for the loan relationship and up to 7 years after closure unless law requires longer. Re-open the consent notice from Help if you need to re-read it.',
  },
  {
    id: 'contact',
    keywords: [
      'help',
      'support',
      'contact',
      'whatsapp',
      'call',
      'sms',
      'officer',
    ],
    answer:
      'Use this chat for quick guidance, or contact Uwezo Fund support via the WhatsApp link (if configured) or your constituency officer. Never share OTPs or passwords in chat.',
  },
];

export function answerAssistiveChat(question: string): string {
  const q = question.toLowerCase().trim();
  if (!q) {
    return 'Ask about loan terms, document uploads, application status, visa/training steps, or disbursement.';
  }

  let best: FaqEntry | null = null;
  let bestScore = 0;
  for (const entry of ASSISTIVE_FAQ) {
    const score = entry.keywords.reduce(
      (acc, kw) => (q.includes(kw) ? acc + 1 : acc),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (!best || bestScore === 0) {
    return (
      'I am a rule-based assistant for Uwezo Loans. Try asking about documents, status, terms, visa/training, or disbursement. ' +
      'For complex cases, contact support via WhatsApp (if available) or your constituency officer. ' +
      '(LLM answers can be enabled later with CHATBOT_LLM_API_KEY.)'
    );
  }

  return best.answer;
}
