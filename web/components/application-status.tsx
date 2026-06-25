'use client';

import type { GeneralDetails, Status } from '@/lib/types/application.types';
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
      case 'GROUP_MEMBER_CONFIRMATION':
        return t.rich('status.groupMemberConfirmation', {
          bold: strongText,
        });
      case 'SUBMITTED':
        return t.rich('status.submitted', {
          bold: strongText,
        });
      case 'CONSTITUENCY_REVIEW':
        return t.rich('status.constituencyReview', {
          bold: strongText,
        });
      case 'APPROVED_BY_CONSTITUENCY':
        return t.rich('status.approvedByConstituency', {
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
      case 'TRAINING':
        return t.rich('status.training', {
          bold: strongText,
        });
      case 'PENDING_FINAL_DISBURSEMENT':
        return t.rich('status.pendingFinalDisbursement', {
          bold: strongText,
        });
      case 'PENDING_SECRETARIAT_REVIEW':
      case 'PENDING_FUND_TRANSFER':
        return t.rich('status.approved', {
          bold: strongText,
        });
      case 'DISBURSEMENT_FAILED':
        return t.rich('status.rejected', {
          bold: strongText,
        });
      case 'CLOSED':
        return t.rich('status.closed', {
          bold: strongText,
        });
      default:
        return t.rich('status.inReview', {
          bold: strongText,
        });
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
            status === 'GROUP_MEMBER_CONFIRMATION' && 'bg-orange-400',
            status === 'SUBMITTED' && 'bg-blue-400',
            status === 'CONSTITUENCY_REVIEW' && 'bg-blue-500',
            status === 'APPROVED_BY_CONSTITUENCY' && 'bg-green-300',
            status === 'IN_REVIEW' && 'bg-green-400',
            status === 'APPROVED' && 'bg-green-600',
            status === 'REJECTED' && 'bg-red-500',
            status === 'DISBURSED' && 'bg-green-800',
            status === 'TRAINING' && 'bg-purple-400',
            status === 'PENDING_SECRETARIAT_REVIEW' && 'bg-indigo-400',
            status === 'PENDING_FUND_TRANSFER' && 'bg-teal-500',
            status === 'PENDING_FINAL_DISBURSEMENT' && 'bg-teal-600',
            status === 'DISBURSEMENT_FAILED' && 'bg-red-400',
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
