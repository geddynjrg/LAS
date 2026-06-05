// app/apply/[id]/member-confirmation/actions.ts
'use server';

import {
  sendMemberConfirmationOtp,
  verifyMemberConfirmationOtp,
  type OtpActionResponse,
} from '@/lib/api/member-confirmation-otp.service';
import { sendConfirmationSMS } from '@/lib/api/sms.service';
import {
  getApplicationById,
  updateApplicationMembersSMSConfirmation,
} from '@/lib/data/application';
import { prisma } from '@/lib/db/prisma';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { getFormZodDataValues } from '@workspace/ui/lib/utils';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// app/apply/[id]/member-confirmation/actions.ts

// Define the schema directly in the actions file to avoid import issues
const memberConfirmationSchema = z.object({
  id: z.string(),
  redirectTo: z.string(),
});

export type MemberConfirmationData = z.infer<typeof memberConfirmationSchema>;

// Add this new action for form submission
export const memberConfirmationAction: FormAction<
  MemberConfirmationData
> = async (_prev, formData) => {
  try {
    const values = getFormZodDataValues(formData, memberConfirmationSchema);
    const redirectTo = formData.get('redirectTo')?.toString();
    const id = formData.get('id')?.toString();

    console.log('Form values:', values);
    console.log('RedirectTo:', redirectTo);
    console.log('ID:', id);

    const { success, data, error } = memberConfirmationSchema.safeParse(values);

    if (!success && error) {
      console.log('Validation error:', error);
      return {
        success,
        errors: error.flatten().fieldErrors,
        values,
      };
    }

    if (!redirectTo) {
      throw new Error('No redirect URL provided');
    }

    if (!id) {
      throw new Error('No application ID provided');
    }

    console.log('Redirecting to confirmations:', redirectTo);

    // Update application progress to at least 6 (Member Confirmation Completed)
    await updateApplicationMembersSMSConfirmation(id);

    // Simply redirect to the next page - no data to save
    redirect(redirectTo);
  } catch (error) {
    console.error('Error in memberConfirmationAction:', error);
    throw error;
  }
};

export async function refreshApplicationData(applicationId: string) {
  try {
    const application = await getApplicationById(applicationId);

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    return {
      success: true,
      application,
    };
  } catch (error) {
    console.error('Error refreshing application:', error);
    return {
      success: false,
      error: 'Failed to refresh application data',
    };
  }
}

export async function sendMemberConfirmations(applicationId: string) {
  try {
    const application = await getApplicationById(applicationId);

    if (!application) {
      return {
        success: false,
        message: 'Application not found',
        stats: null,
      };
    }

    if (!application.members || application.members.members.length === 0) {
      return {
        success: false,
        message: 'No members found in application',
        stats: null,
      };
    }

    // Call Drupal backend to send SMS to all members
    const result = await sendConfirmationSMS(applicationId);

    if (result.success && result.stats) {
      return {
        success: true,
        message: result.stats.message,
        stats: {
          total:
            (result.stats.data?.sms_sent || 0) +
            (result.stats.data?.sms_failed || 0),
          sms_sent: result.stats.data?.sms_sent || 0,
          sms_failed: result.stats.data?.sms_failed || 0,
          status_type:
            result.stats.data?.sms_failed > 0
              ? 'partial_success'
              : 'total_success',
        },
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to send confirmations',
        stats: null,
      };
    }
  } catch (error) {
    console.error('Error sending member confirmations:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
      stats: null,
    };
  }
}

export async function sendMemberOtp(
  applicationId: string,
  nationalIdCode: string,
): Promise<OtpActionResponse> {
  return sendMemberConfirmationOtp(applicationId, nationalIdCode);
}

export async function verifyMemberOtp(
  applicationId: string,
  nationalIdCode: string,
  otpCode: string,
): Promise<OtpActionResponse> {
  const result = await verifyMemberConfirmationOtp(
    applicationId,
    nationalIdCode,
    otpCode,
  );

  if (result.success) {
    const application = await prisma.application.findUnique({
      where: { applicationId },
      select: { id: true },
    });

    if (application) {
      const confirmationStatus =
        result.member?.confirmation_status === 'declined'
          ? 'declined'
          : 'confirmed';

      await prisma.memberData.updateMany({
        where: {
          applicationId: application.id,
          nationalIdCode,
        },
        data: {
          confirmation_status: confirmationStatus,
          ...(confirmationStatus === 'confirmed'
            ? {
                confirmation_confirmed_at: new Date(),
                status: 'CONFIRMED',
              }
            : {}),
        },
      });
    }
  }

  return result;
}
