import type { GroupData } from '@/lib/data/application';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { DataNode } from '@workspace/ui/components/data-node';
import type { ValidFile } from '@workspace/ui/lib/zod';
import { useFormatter, useTranslations } from 'next-intl';
import type { FC } from 'react';

export const ApplicationReviewGroupData: FC<{
  groupData?: GroupData;
}> = ({ groupData }) => {
  const t = useTranslations('ApplicationDetailsPage');
  const format = useFormatter();

  if (!groupData?.basics && !groupData?.location && !groupData?.background) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t('groupData.groupData')}</h4>
      <Accordion type="multiple" className="space-y-2">
        {groupData.basics && (
          <AccordionItem value="basics">
            <AccordionTrigger>
              {t('groupData.basicInfo.groupBasics')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode label={t('groupData.basicInfo.groupName')}>
                  {groupData.basics.groupName}
                </DataNode>
                <DataNode label={t('groupData.basicInfo.registrationNumber')}>
                  {groupData.basics.groupRegistrationNumber}
                </DataNode>
                <DataNode label={t('groupData.basicInfo.dateFormed')}>
                  {format.dateTime(new Date(groupData.basics.dateFormed), {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                  })}
                </DataNode>
                <DataNode
                  label={t('groupData.basicInfo.groupRegistrationCert')}
                >
                  {getFileName(groupData.basics.groupRegistrationCertificate)}
                </DataNode>
                <DataNode label={t('groupData.basicInfo.listOfMembersOnCert')}>
                  {getFileName(groupData.basics.listOfMembersOnCertificate)}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {groupData.location && (
          <AccordionItem value="location">
            <AccordionTrigger>
              {t('groupData.locationInfo.locationOfTheGroup')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode
                  label={t('groupData.locationInfo.countryOfOperation')}
                >
                  {groupData.location.countyOfOperation}
                </DataNode>
                <DataNode label={t('groupData.locationInfo.constituency')}>
                  {groupData.location.constituency}
                </DataNode>
                <DataNode label={t('groupData.locationInfo.ward')}>
                  {groupData.location.ward}
                </DataNode>
                <DataNode label={t('groupData.locationInfo.meetingPoint')}>
                  {groupData.location.meetingPoint}
                </DataNode>
                <DataNode label={t('groupData.locationInfo.nearestLandmark')}>
                  {groupData.location.nearestLandmark}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {groupData.background && (
          <AccordionItem value="background">
            <AccordionTrigger>
              {t('groupData.groupBackground.groupBackground')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode
                  label={t('groupData.groupBackground.purposeOfTheGroup')}
                >
                  {groupData.background.purposeOfTheGroup.map((purpose) => (
                    <span key={purpose}>{purpose}</span>
                  ))}
                </DataNode>
                <DataNode
                  label={t('groupData.groupBackground.keyActivitiesOfGroup')}
                >
                  {groupData.background.keyActivitiesOfTheGroup.map(
                    (activity) => (
                      <span key={activity}>{activity}</span>
                    ),
                  )}
                </DataNode>
                <DataNode label={t('groupData.groupBackground.creditHistory')}>
                  {Array.isArray(groupData.background.groupCreditHistory)
                    ? groupData.background.groupCreditHistory
                        .map((file) => getFileName(file))
                        .join(', ')
                    : getFileName(groupData.background.groupCreditHistory)}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

function getFileName(file: ValidFile) {
  if (typeof File !== 'undefined' && file instanceof File) {
    return file.name;
  }

  return (file as { filename?: string }).filename || 'Unknown file';
}
