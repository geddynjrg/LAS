'use client';

import type { GeneralDetails, Status } from '@/lib/data/application';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import type { FC, ReactNode } from 'react';

interface ApplicationStatusProps {
  status: Status;
  rejectionDetails?: GeneralDetails['rejectionDetails'];
}

export const ApplicationStatus: FC<ApplicationStatusProps> = ({
  status,
  rejectionDetails,
}) => {
  const t = useTranslations('DashboardPage');

  const strongText = (chunk: ReactNode) => <strong>{chunk}</strong>;

  const getStatusText = () => {
    switch (status) {
      case 'UNSUBMITTED':
        return t.rich('status.unsubmitted', {
          bold: strongText,
        });
      case 'DRAFT':
        return t.rich('status.draft', {
          bold: strongText,
        });
      case 'SUBMITTED':
        return t.rich('status.submitted', {
          bold: strongText,
        });
      case 'PENDING':
        return t.rich('status.pending', {
          bold: strongText,
        });
      case 'IN_REVIEW':
        return t.rich('status.inReview', {
          bold: strongText,
        });
      case 'APPROVED':
        return t.rich('status.approved', {
          bold: strongText,
        });
      case 'REJECTED':
        return t.rich('status.rejected', {
          bold: strongText,
        });
      case 'DISBURSED':
        return t.rich('status.disbursed', {
          bold: strongText,
        });
      case 'CLOSED':
        return t.rich('status.closed', {
          bold: strongText,
        });
      default:
        return null;
    }
  };

  const getRejectionReasonText = (reason?: string) => {
    if (!reason) return null;

    const reasonMap: Record<string, string> = {
      incomplete_information: t('rejectionReasons.incompleteInformation'),
      missing_documents: t('rejectionReasons.missingDocuments'),
      eligibility_criteria: t('rejectionReasons.eligibilityCriteria'),
      duplicate_application: t('rejectionReasons.duplicateApplication'),
      insufficient_collateral: t('rejectionReasons.insufficientCollateral'),
      poor_credit_history: t('rejectionReasons.poorCreditHistory'),
      member_declined: t('rejectionReasons.memberDeclined'),
      other: t('rejectionReasons.other'),
    };

    return reasonMap[reason] || reason;
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div
          className={cn(
            'mt-1 h-4 min-h-4 w-4 min-w-4 rounded-full',
            status === 'UNSUBMITTED' && 'bg-gray-400',
            status === 'DRAFT' && 'bg-yellow-400',
            status === 'SUBMITTED' && 'bg-blue-400',
            (status === 'IN_REVIEW' || status === 'PENDING') && 'bg-green-400',
            status === 'APPROVED' && 'bg-green-600',
            status === 'REJECTED' && 'bg-red-500',
            status === 'DISBURSED' && 'bg-green-800',
            status === 'CLOSED' && 'bg-gray-600',
          )}
        ></div>
        <span className="text-[21px] leading-[27px]">{getStatusText()}</span>
      </div>

      {/* Rejection Details */}
      {status === 'REJECTED' && rejectionDetails && (
        <div className="ml-7 rounded-md border border-red-200 bg-red-50 p-3">
          {rejectionDetails.rejectionReason && (
            <div className="mb-2">
              <p className="text-sm font-medium text-red-800">
                {t('rejectionDetails.reason')}:
              </p>
              <p className="text-sm text-red-700">
                {getRejectionReasonText(rejectionDetails.rejectionReason)}
              </p>
            </div>
          )}
          {rejectionDetails.rejectionMessage && (
            <div>
              <p className="text-sm font-medium text-red-800">
                {t('rejectionDetails.message')}:
              </p>
              <p className="text-sm text-red-700">
                {rejectionDetails.rejectionMessage}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
