'use client';

import {
  type OcrCaptureResult,
  OcrDocumentCapture,
} from '@/components/ocr-document-capture';
import {
  type ChatMessage,
  answerAssistiveChat,
} from '@/lib/assistive-chatbot-faq';
import type { OcrDocType } from '@/lib/kenyan-id-ocr';
import {
  expectedDocLabel,
  resolveOcrDocType,
  toAuthenticityDeclaredType,
} from '@/lib/kenyan-id-ocr';
import { Button } from '@workspace/ui/components/button';
import { usePathname } from 'next/navigation';
import {
  type Dispatch,
  type FC,
  type FormEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type Phase =
  | 'boot'
  | 'await_auth_method'
  | 'await_username'
  | 'await_password'
  | 'await_phone'
  | 'await_otp'
  | 'menu'
  | 'apply_choice'
  | 'status_wait'
  | 'apply_docs'
  | 'stage_pick'
  | 'field_pick'
  | 'await_field'
  | 'await_upload'
  | 'open';

type QuickReply = { id: string; label: string; value: string };

type FieldContext = {
  kind: 'loan';
  appId: string;
  stage: number;
  field: string;
  label: string;
  uploadCategory?: string;
};

const MAIN_MENU: QuickReply[] = [
  { id: 'apply', label: '1. Apply for a loan', value: 'apply' },
  {
    id: 'status',
    label: '2. Check status of loan application',
    value: 'status',
  },
];

const APPLY_TYPE: QuickReply[] = [
  {
    id: 'continue',
    label: '1. Continue existing application',
    value: 'continue_app',
  },
  { id: 'new', label: '2. Start new Group Application', value: 'new_app' },
];

const AUTH_METHOD_REPLIES: QuickReply[] = [
  { id: 'auth-email', label: 'Email / password', value: 'auth:email' },
  { id: 'auth-phone', label: 'Mobile phone (OTP)', value: 'auth:phone' },
  { id: 'auth-ecitizen', label: 'eCitizen', value: 'auth:ecitizen' },
];

const WHATSAPP_ENV =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER || ''
    : '';

function waLink(number: string): string | null {
  const digits = number.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    'Hello Uwezo Fund support — I need help with my Uwezo Loans application.',
  )}`;
}

function pushAssistant(
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  content: string,
) {
  setMessages((prev) => [...prev, { role: 'assistant', content }]);
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

function mapDocType(docType: string): OcrDocType {
  return resolveOcrDocType(docType);
}

function docTypeLabel(docType: string): string {
  return expectedDocLabel(resolveOcrDocType(docType));
}

export const AssistiveChatbot: FC<{
  productLabel?: string;
  supportWhatsApp?: string;
}> = ({
  productLabel = 'Uwezo Loans Assistant',
  supportWhatsApp = WHATSAPP_ENV,
}) => {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>('boot');
  const [username, setUsername] = useState('');
  const [otpRequestId, setOtpRequestId] = useState('');
  const [allowPdfOnly, setAllowPdfOnly] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [docType, setDocType] = useState<
    'national_id' | 'kra_pin' | 'passport'
  >('national_id');
  const [fieldContext, setFieldContext] = useState<FieldContext | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const autoOpened = useRef(false);

  const whatsappHref = useMemo(
    () => waLink(supportWhatsApp || ''),
    [supportWhatsApp],
  );
  const hide = pathname.startsWith('/ps');
  const passwordMode = phase === 'await_password';
  const otpMode = phase === 'await_otp';
  const sensitiveMode = passwordMode || otpMode;
  const showUpload = phase === 'apply_docs' || phase === 'await_upload';
  const showOcr = phase === 'await_upload' || phase === 'apply_docs';

  useEffect(() => {
    if (autoOpened.current || hide) return;
    if (isMobileViewport()) {
      autoOpened.current = true;
      setOpen(true);
      setPhase('boot');
    }
  }, [hide]);

  const startAuthFlow = useCallback(() => {
    setPhase('await_auth_method');
    setUsername('');
    setOtpRequestId('');
    setQuickReplies(AUTH_METHOD_REPLIES);
    setFieldContext(null);
    setAllowPdfOnly(false);
    setMessages([
      {
        role: 'assistant',
        content: 'Welcome to the Uwezo Loans assistant. Choose how to sign in.',
      },
    ]);
  }, []);

  const showSignedInMenu = useCallback(() => {
    setPhase('menu');
    setQuickReplies(MAIN_MENU);
    setFieldContext(null);
    setOtpRequestId('');
    setAllowPdfOnly(false);
    setMessages([
      {
        role: 'assistant',
        content: 'Signed in successfully.\nWhat would you like to do?',
      },
    ]);
  }, []);

  useEffect(() => {
    if (!open || phase !== 'boot') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/assistive-chat/login');
        const data = (await res.json()) as { authenticated?: boolean };
        if (cancelled) return;
        if (data.authenticated) showSignedInMenu();
        else startAuthFlow();
      } catch {
        if (!cancelled) startAuthFlow();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, phase, startAuthFlow, showSignedInMenu]);

  const login = useCallback(async (user: string, password: string) => {
    const res = await fetch('/api/assistive-chat/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password }),
    });
    return (await res.json()) as { ok?: boolean; error?: string };
  }, []);

  const loginWithMethod = useCallback(async (body: Record<string, string>) => {
    const res = await fetch('/api/assistive-chat/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as {
      ok?: boolean;
      error?: string;
      message?: string;
      requestId?: string;
      redirect?: string;
    };
  }, []);

  type ServerPayload = {
    reply?: string;
    needAuth?: boolean;
    expectReference?: boolean;
    expectFieldValue?: boolean;
    expectUpload?: boolean;
    quickReplies?: QuickReply[];
    phase?: string;
    openUrl?: string;
    navigate?: boolean;
    fieldContext?: FieldContext;
  };

  const applyServerPayload = useCallback(
    (data: ServerPayload) => {
      if (data.needAuth) {
        startAuthFlow();
        return;
      }
      if (data.expectReference) setPhase('status_wait');
      if (data.expectFieldValue || data.phase === 'await_field')
        setPhase('await_field');
      if (data.expectUpload || data.phase === 'await_upload')
        setPhase('await_upload');
      if (data.phase === 'stage_pick') setPhase('stage_pick');
      if (data.phase === 'field_pick') setPhase('field_pick');
      if (data.phase === 'apply_docs') setPhase('apply_docs');
      if (data.fieldContext) setFieldContext(data.fieldContext);
      else if (data.phase === 'stage_pick' || data.phase === 'field_pick') {
        setFieldContext(null);
      }
      if (data.quickReplies) setQuickReplies(data.quickReplies);
      pushAssistant(setMessages, data.reply || 'OK');
      if (
        data.navigate &&
        data.openUrl?.startsWith('/') &&
        typeof window !== 'undefined'
      ) {
        window.setTimeout(() => {
          window.location.href = data.openUrl!;
        }, 400);
      }
    },
    [startAuthFlow],
  );

  const postChat = useCallback(
    async (payload: Record<string, string | number>) => {
      const res = await fetch('/api/assistive-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, path: pathname }),
      });
      return (await res.json()) as ServerPayload;
    },
    [pathname],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setBusy(true);
      const displayUser =
        phase === 'await_password' || phase === 'await_otp'
          ? '••••••••'
          : trimmed;
      setMessages((prev) => [...prev, { role: 'user', content: displayUser }]);
      setInput('');

      try {
        if (trimmed.startsWith('open:') && trimmed.slice(5).startsWith('/')) {
          window.location.href = trimmed.slice(5);
          setBusy(false);
          return;
        }

        if (phase === 'await_auth_method' || trimmed.startsWith('auth:')) {
          if (trimmed === 'auth:email') {
            setPhase('await_username');
            setQuickReplies([]);
            pushAssistant(setMessages, 'Enter your account email (username).');
            setBusy(false);
            return;
          }
          if (trimmed === 'auth:phone') {
            setPhase('await_phone');
            setOtpRequestId('');
            setQuickReplies([
              {
                id: 'back-auth',
                label: 'Back to sign-in options',
                value: 'auth:back',
              },
            ]);
            pushAssistant(
              setMessages,
              'Enter your Kenyan mobile number (e.g. 07… or +254…).',
            );
            setBusy(false);
            return;
          }
          if (trimmed === 'auth:ecitizen') {
            const result = await loginWithMethod({
              method: 'ecitizen',
              callbackUrl: pathname || '/',
            });
            pushAssistant(
              setMessages,
              result.message ||
                'eCitizen needs browser OAuth. Complete sign-in in the browser, then reopen Help.',
            );
            if (result.redirect && typeof window !== 'undefined') {
              window.location.href = result.redirect;
            } else {
              setQuickReplies(AUTH_METHOD_REPLIES);
              setPhase('await_auth_method');
            }
            setBusy(false);
            return;
          }
          if (trimmed === 'auth:back') {
            startAuthFlow();
            setBusy(false);
            return;
          }
          if (phase === 'await_auth_method') {
            pushAssistant(
              setMessages,
              'Choose Email / password, Mobile phone (OTP), or eCitizen.',
            );
            setQuickReplies(AUTH_METHOD_REPLIES);
            setBusy(false);
            return;
          }
        }

        if (phase === 'await_username') {
          setUsername(trimmed);
          setPhase('await_password');
          setQuickReplies([]);
          pushAssistant(
            setMessages,
            'Enter your password (it stays masked and is not stored in this chat).',
          );
          setBusy(false);
          return;
        }

        if (phase === 'await_password') {
          const result = await login(username, trimmed);
          if (!result.ok) {
            pushAssistant(
              setMessages,
              `${result.error || 'Sign-in failed.'}\nChoose how to sign in again.`,
            );
            startAuthFlow();
            setBusy(false);
            return;
          }
          showSignedInMenu();
          setBusy(false);
          return;
        }

        if (phase === 'await_phone') {
          const result = await loginWithMethod({
            method: 'phone_send',
            phone: trimmed,
          });
          if (!result.ok || !result.requestId) {
            pushAssistant(
              setMessages,
              result.error ||
                'Could not send OTP. Check the number and try again.',
            );
            setBusy(false);
            return;
          }
          setOtpRequestId(result.requestId);
          setPhase('await_otp');
          setQuickReplies([
            {
              id: 'back-auth',
              label: 'Back to sign-in options',
              value: 'auth:back',
            },
          ]);
          pushAssistant(
            setMessages,
            result.message ||
              'OTP sent by SMS. Enter the 6-digit code (it stays masked).',
          );
          setBusy(false);
          return;
        }

        if (phase === 'await_otp') {
          const result = await loginWithMethod({
            method: 'phone_verify',
            requestId: otpRequestId,
            otp: trimmed,
          });
          if (!result.ok) {
            pushAssistant(
              setMessages,
              `${result.error || 'Invalid or expired OTP.'}\nEnter the code again, or go back to sign-in options.`,
            );
            setBusy(false);
            return;
          }
          showSignedInMenu();
          setBusy(false);
          return;
        }

        if (phase === 'await_field' && fieldContext) {
          if (/^menu$/i.test(trimmed)) {
            showSignedInMenu();
            setBusy(false);
            return;
          }
          if (
            trimmed.startsWith('stage:') ||
            trimmed.startsWith('select_app:') ||
            trimmed.startsWith('field:')
          ) {
            applyServerPayload(
              await postChat({ action: trimmed, message: trimmed }),
            );
            setBusy(false);
            return;
          }
          applyServerPayload(
            await postChat({
              action: 'set_field',
              message: trimmed,
              value: trimmed,
              appId: fieldContext.appId,
              stage: fieldContext.stage,
              field: fieldContext.field,
            }),
          );
          setBusy(false);
          return;
        }

        if (phase === 'status_wait') {
          const data = await postChat({
            action: 'status',
            reference: trimmed,
            message: trimmed,
          });
          applyServerPayload(data);
          if (!data.expectReference && !data.phase) setPhase('menu');
          setBusy(false);
          return;
        }

        if (/^(apply|1)$/i.test(trimmed)) {
          setPhase('apply_choice');
          setQuickReplies(APPLY_TYPE);
          pushAssistant(
            setMessages,
            'Choose how to continue:\n1. Continue existing application\n2. Start new Group Application',
          );
          setBusy(false);
          return;
        }

        if (/^(status|2)$/i.test(trimmed) && phase !== 'apply_choice') {
          setPhase('status_wait');
          setQuickReplies([
            { id: 'list', label: 'List my applications', value: 'list' },
            { id: 'menu', label: 'Back to menu', value: 'menu' },
          ]);
          pushAssistant(
            setMessages,
            'Send your application ID (APP-YYYYMMDD-XXXXXX) or tap List.',
          );
          setBusy(false);
          return;
        }

        if (phase === 'apply_choice' && /^(continue_app|1)/i.test(trimmed)) {
          const data = await postChat({
            action: 'list_continue',
            message: 'continue_app',
          });
          applyServerPayload(data);
          setBusy(false);
          return;
        }

        if (phase === 'apply_choice' && /^(new_app|2)/i.test(trimmed)) {
          setPhase('apply_docs');
          setAllowPdfOnly(false);
          setQuickReplies([
            {
              id: 'create',
              label: 'Open /apply/create',
              value: 'open:/apply/create',
            },
            { id: 'menu', label: 'Back to menu', value: 'menu' },
          ]);
          pushAssistant(
            setMessages,
            'Start a new application at /apply/create. Scan ID/KRA with OCR below for an assistive authenticity check.',
          );
          setBusy(false);
          return;
        }

        if (/^menu$/i.test(trimmed)) {
          showSignedInMenu();
          setBusy(false);
          return;
        }

        if (phase === 'apply_docs') {
          if (
            trimmed.startsWith('select_app:') ||
            trimmed.startsWith('stage:') ||
            trimmed.startsWith('field:') ||
            trimmed.startsWith('status_ref:')
          ) {
            applyServerPayload(
              await postChat({ action: trimmed, message: trimmed }),
            );
            setBusy(false);
            return;
          }
          const lower = trimmed.toLowerCase();
          if (lower === 'pdf_only' || lower.includes('pdf only')) {
            setAllowPdfOnly(true);
            pushAssistant(
              setMessages,
              `PDF only (no camera OCR) for ${docTypeLabel(docType)}. Use the PDF attach control below.`,
            );
            setBusy(false);
            return;
          }
          if (lower.includes('kra')) {
            setDocType('kra_pin');
            setAllowPdfOnly(false);
          } else if (lower.includes('passport')) {
            setDocType('passport');
            setAllowPdfOnly(false);
          } else if (lower.includes('id')) {
            setDocType('national_id');
            setAllowPdfOnly(false);
          }
          pushAssistant(
            setMessages,
            `Ready for ${
              lower.includes('kra')
                ? 'KRA PIN'
                : lower.includes('passport')
                  ? 'passport'
                  : 'National ID'
            }. Use the OCR scanner below (images), or PDF only if you have a PDF.`,
          );
          setBusy(false);
          return;
        }

        let action = 'auto';
        if (/^list$/i.test(trimmed)) action = 'status';
        else if (/^status_ref:/i.test(trimmed)) action = trimmed;
        else if (/^continue_app$/i.test(trimmed)) action = 'list_continue';
        else if (/^select_app:/i.test(trimmed)) action = trimmed;
        else if (/^stage:/i.test(trimmed)) action = trimmed;
        else if (/^field:/i.test(trimmed)) action = trimmed;

        const data = await postChat({
          action,
          message: trimmed,
          reference: trimmed,
        });
        if (!data.reply && !data.needAuth) {
          pushAssistant(setMessages, answerAssistiveChat(trimmed));
        } else {
          applyServerPayload(data);
        }
      } finally {
        setBusy(false);
      }
    },
    [
      busy,
      phase,
      username,
      otpRequestId,
      docType,
      fieldContext,
      pathname,
      login,
      loginWithMethod,
      postChat,
      applyServerPayload,
      showSignedInMenu,
      startAuthFlow,
    ],
  );

  const uploadFile = useCallback(
    async (
      file: File,
      options?: { ocrPassed?: boolean; ocrConfidence?: number },
    ) => {
      if (busy) return;
      setBusy(true);
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: `[Uploaded file: ${file.name}]` },
      ]);
      try {
        const form = new FormData();
        form.set('file', file);
        const fieldKey =
          fieldContext?.uploadCategory || fieldContext?.field || docType;
        const ocrType = resolveOcrDocType(fieldKey);
        form.set('declaredType', toAuthenticityDeclaredType(ocrType));
        form.set('expectedDocType', ocrType);
        if (options?.ocrPassed) {
          form.set('ocrPassed', '1');
          form.set('ocrConfidence', String(options.ocrConfidence ?? 0));
        }
        if (fieldContext?.appId) {
          form.set('applicationId', fieldContext.appId);
          form.set(
            'category',
            fieldContext.uploadCategory || fieldContext.field,
          );
          form.set('persist', '1');
        }
        const res = await fetch('/api/assistive-chat/upload', {
          method: 'POST',
          body: form,
        });
        const data = (await res.json()) as {
          reply?: string;
          nextHint?: string;
          error?: string;
          quickReplies?: QuickReply[];
          phase?: string;
        };
        if (!res.ok) {
          pushAssistant(setMessages, data.error || 'Upload check failed.');
          if (res.status === 401) startAuthFlow();
        } else {
          pushAssistant(
            setMessages,
            `${data.reply || 'Checked.'}\n${data.nextHint || ''}`,
          );
          if (Array.isArray(data.quickReplies)) {
            setQuickReplies(data.quickReplies);
          }
          if (data.phase === 'field_pick') setPhase('field_pick');
          if (fieldContext?.appId) {
            const again = await postChat({
              action: `stage:${fieldContext.appId}:${fieldContext.stage}`,
              message: `stage:${fieldContext.appId}:${fieldContext.stage}`,
            });
            applyServerPayload(again);
          }
        }
      } catch {
        pushAssistant(setMessages, 'Could not check that file.');
      }
      setBusy(false);
    },
    [busy, docType, fieldContext, startAuthFlow, postChat, applyServerPayload],
  );

  const onOcrCaptured = useCallback(
    (result: OcrCaptureResult) => {
      void uploadFile(result.file, {
        ocrPassed: true,
        ocrConfidence: result.ocr.confidence,
      });
    },
    [uploadFile],
  );

  const onPdfUpload = useCallback(
    (file: File) => {
      void uploadFile(file);
    },
    [uploadFile],
  );

  if (hide) return null;

  const ocrLabel =
    phase === 'await_upload'
      ? fieldContext?.label || 'document'
      : docTypeLabel(docType);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="pointer-events-auto flex h-[min(78svh,600px)] w-[min(100vw-1.5rem,400px)] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          <header className="flex items-center justify-between gap-2 border-b bg-sky-50 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-sky-950">
                {productLabel}
              </p>
              <p className="text-[11px] text-sky-800">
                Secure assist · mobile-first · passwords never stored
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-sky-900 underline"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </header>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2 text-sm whitespace-pre-wrap">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={
                  m.role === 'user'
                    ? 'ml-6 rounded-md bg-primary/10 px-2 py-1.5'
                    : 'mr-4 rounded-md bg-muted px-2 py-1.5'
                }
              >
                {m.content}
              </div>
            ))}
            {quickReplies.length > 0 && !sensitiveMode ? (
              <div className="mr-2 flex flex-wrap gap-1.5 pt-1">
                {quickReplies.map((qr) => (
                  <button
                    key={qr.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void send(qr.value)}
                    className="rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1 text-left text-xs font-medium text-sky-950 hover:bg-sky-100 disabled:opacity-50"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            ) : null}
            {showOcr ? (
              <div className="space-y-2 pt-1">
                <OcrDocumentCapture
                  declaredType={mapDocType(
                    fieldContext?.uploadCategory ||
                      fieldContext?.field ||
                      docType,
                  )}
                  label={ocrLabel}
                  onCaptured={onOcrCaptured}
                />
                {phase === 'apply_docs' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      disabled={busy}
                      onClick={() => {
                        setAllowPdfOnly(true);
                        pushAssistant(
                          setMessages,
                          `PDF only (no camera OCR) for ${docTypeLabel(docType)}. Attach a PDF below.`,
                        );
                      }}
                    >
                      PDF only (no camera)
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      Images use OCR; PDFs may attach without camera OCR.
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {showUpload && allowPdfOnly ? (
            <div className="flex items-center gap-2 border-t px-2 py-1.5">
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPdfUpload(f);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="text-xs"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                Attach PDF ({docTypeLabel(docType)})
              </Button>
              <a href="/dashboard" className="text-xs text-sky-800 underline">
                Open dashboard
              </a>
            </div>
          ) : showUpload ? (
            <div className="flex items-center gap-2 border-t px-2 py-1.5">
              <a href="/dashboard" className="text-xs text-sky-800 underline">
                Open dashboard
              </a>
            </div>
          ) : null}
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="border-t px-3 py-1.5 text-center text-xs text-emerald-800 underline"
            >
              Continue on WhatsApp
            </a>
          ) : null}
          <form
            className="flex gap-2 border-t p-2"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              className="min-w-0 flex-1 rounded border px-2 py-1.5 text-sm"
              placeholder={
                passwordMode
                  ? 'Password'
                  : otpMode
                    ? 'OTP code'
                    : phase === 'await_phone'
                      ? 'Mobile number…'
                      : phase === 'await_username'
                        ? 'Email / username'
                        : phase === 'await_auth_method'
                          ? 'Or tap a sign-in option…'
                          : phase === 'status_wait'
                            ? 'Application ID…'
                            : phase === 'await_field'
                              ? `Enter ${fieldContext?.label || 'value'}…`
                              : 'Type a message…'
              }
              type={sensitiveMode ? 'password' : 'text'}
              autoComplete={
                passwordMode
                  ? 'current-password'
                  : otpMode
                    ? 'one-time-code'
                    : phase === 'await_phone'
                      ? 'tel'
                      : 'username'
              }
              inputMode={otpMode ? 'numeric' : undefined}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label={
                passwordMode
                  ? 'Password'
                  : otpMode
                    ? 'OTP code'
                    : 'Chat message'
              }
            />
            <Button type="submit" size="sm" disabled={busy || !input.trim()}>
              Send
            </Button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        className="pointer-events-auto rounded-full bg-sky-700 px-4 py-3 text-sm font-medium text-white shadow-md hover:bg-sky-800"
        onClick={() => {
          setOpen((v) => {
            if (!v) setPhase('boot');
            return !v;
          });
        }}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? '×' : 'Help'}
      </button>
    </div>
  );
};
