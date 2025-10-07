import { FileLink } from '@/components/file-link';
import type { GroupData } from '@/lib/types/application.types';
import { IconPencil } from '@tabler/icons-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import { DataNode } from '@workspace/ui/components/data-node';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import type { FC } from 'react';

export const ApplicationReviewGroupData: FC<{
  groupData?: GroupData;
  applicationId?: string;
}> = ({ groupData, applicationId }) => {
  const t = useTranslations('ApplicationDetailsPage');
  const format = useFormatter();

  if (!groupData?.basics && !groupData?.location && !groupData?.background) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <div className="flex items-center justify-between pb-2">
        <h4 className="typo-h4">{t('groupData.groupData')}</h4>
        {applicationId && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/apply/${applicationId}/group-data`}>
              <IconPencil className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
        )}
      </div>
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
                  <FileLink
                    file={groupData.basics.groupRegistrationCertificate}
                  />
                </DataNode>
                <DataNode label={t('groupData.basicInfo.listOfMembersOnCert')}>
                  <FileLink
                    file={groupData.basics.listOfMembersOnCertificate}
                  />
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
                  <FileLink file={groupData.background.groupCreditHistory} />
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};
