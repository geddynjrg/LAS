// lib/validation/application-validation.ts
import { ApplicationData, Member } from '@/lib/types/application.types';
import type { ValidFile } from '@workspace/ui/lib/zod'; 

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  missingFields: string[];
  warnings: string[];
}

export function validateApplicationForSubmission(application: ApplicationData): ValidationResult {
  const errors: string[] = [];
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Check if application exists
  if (!application) {
    return {
      isValid: false,
      errors: ['Application not found'],
      missingFields: [],
      warnings: []
    };
  }

  // 1. Validate Group Data
  if (!application.groupData) {
    errors.push('Group information is incomplete');
    missingFields.push('Group Data');
  } else {
    const groupData = application.groupData;
    
    // Check required basics
    if (!groupData.basics?.groupName) missingFields.push('Group Name');
    if (!groupData.basics?.groupRegistrationNumber) missingFields.push('Registration Number');
    if (!groupData.basics?.dateFormed) missingFields.push('Date Formed');
    if (!isValidFileObject(groupData.basics?.groupRegistrationCertificate)) missingFields.push('Registration Certificate');
    if (!isValidFileObject(groupData.basics?.listOfMembersOnCertificate)) missingFields.push('Members List Certificate');
    if (!groupData.basics?.groupMeetingMinutes || groupData.basics.groupMeetingMinutes.length === 0) {
      missingFields.push('Group Meeting Minutes');
    } // else if validate each file in array? if is a valid file object
    if (groupData.basics?.groupMeetingMinutes) {
      groupData.basics.groupMeetingMinutes.forEach((file, index) => {
        if (!isValidFileObject(file)) {
          missingFields.push(`Group Meeting Minutes File ${index + 1}`);
        }
      });
    }
    
    // Check background
    if (!groupData.background?.purposeOfTheGroup?.length) missingFields.push('Purpose of Group');
    if (!groupData.background?.keyActivitiesOfTheGroup?.length) missingFields.push('Key Activities');
    if (!groupData.background?.groupCreditHistory?.length) missingFields.push('Group Credit History');
    
    // Check location
    if (!groupData.location?.countyOfOperation) missingFields.push('County');
    if (!groupData.location?.constituency) missingFields.push('Constituency');
    if (!groupData.location?.ward) missingFields.push('Ward');
    if (!groupData.location?.meetingPoint) missingFields.push('Meeting Point');
    if (!groupData.location?.nearestLandmark) missingFields.push('Nearest Landmark');
  }

  // 2. Validate Members (CRITICAL - Must have members)
  if (!application.members || !application.members.members || application.members.members.length === 0) {
    errors.push('No members added to the application');
    missingFields.push('Members');
  } else {
    const members = application.members.members;
    
    // Check each member has required fields
    members.forEach((member: Member, index: number) => {
      const memberNumber = index + 1;
      
      if (!member.fullname) missingFields.push(`Member ${memberNumber} - Full Name`);
      if (!member.nationalIdCode) missingFields.push(`Member ${memberNumber} - National ID`);
      if (!member.phoneNumber) missingFields.push(`Member ${memberNumber} - Phone Number`);
      if (!member.type) missingFields.push(`Member ${memberNumber} - Position`);
      if (!member.economicActivity) missingFields.push(`Member ${memberNumber} - Economic Activity`);
      if (!isValidFileObject(member.photoOfId)) missingFields.push(`Member ${memberNumber} - Photo ID`);
      if (!member.gender) missingFields.push(`Member ${memberNumber} - Gender`);
    });

    // Check for member consent (CRITICAL REQUIREMENT)
    const totalMembers = members.length;
    const respondedCount = members.filter(member => 
      member.confirmation_status && 
      member.confirmation_status !== 'pending' && 
      member.confirmation_status !== 'sent'
    ).length;
    
    const consentedCount = members.filter(member => 
      member.confirmation_status === 'confirmed'
    ).length;

    // Check if atleast 75% have responded
    const requiredResponses = Math.ceil(totalMembers * 0.75);
    
    if (respondedCount < requiredResponses) {
      errors.push(`at least ${requiredResponses} member(s) have to respond to consent requests`);
    }

    // Check if 75% have consented (from those who responded)
    const requiredConsent = Math.ceil(totalMembers * 0.75);
    if (consentedCount < requiredConsent) {
      errors.push(`Only ${consentedCount} of ${requiredConsent} required members have consented to the loan`);
    }

    // Check for duplicate phone numbers or national IDs
    const phoneNumbers = new Set<string>();
    const nationalIds = new Set<string>();
    
    members.forEach((member: Member, index: number) => {
      if (member.phoneNumber) {
        if (phoneNumbers.has(member.phoneNumber)) {
          errors.push(`Duplicate phone number: ${member.phoneNumber} used by multiple members`);
        }
        phoneNumbers.add(member.phoneNumber);
      }

      if (member.nationalIdCode) {
        if (nationalIds.has(member.nationalIdCode)) {
          errors.push(`Duplicate national ID: ${member.nationalIdCode} used by multiple members`);
        }
        nationalIds.add(member.nationalIdCode);
      }
    });

    // Check nature of group
    if (!application.members.natureOfTheGroup) {
      missingFields.push('Nature of Group');
    }
  }

  // 3. Validate Loan Conditions
  if (!application.loanConditions) {
    errors.push('Loan conditions are incomplete');
    missingFields.push('Loan Conditions');
  } else {
    const loan = application.loanConditions;
    if (!loan.loanType) missingFields.push('Loan Type');
    if (!loan.loanAmount || loan.loanAmount <= 0) missingFields.push('Valid Loan Amount');
    if (!loan.repaymentPeriod || loan.repaymentPeriod <= 0) missingFields.push('Repayment Period');
    if (!loan.bankName) missingFields.push('Bank/SACCO Name');
    if (!loan.bankBranch) missingFields.push('Bank/SACCO Branch');
    if (!loan.accountNumber) missingFields.push('Account Number');
  }

  // 4. Validate Proposed Business
  if (!application.proposedBusiness) {
    errors.push('Business information is incomplete');
    missingFields.push('Business Information');
  } else {
    const business = application.proposedBusiness;
    if (!business.natureOfBusiness) missingFields.push('Nature of Business');
    if (!business.businessType?.length) missingFields.push('Business Type');
    if (business.yearsInBusiness === undefined || business.yearsInBusiness === null) missingFields.push('Years in Business');
    if (business.averageIncome === undefined || business.averageIncome === null) missingFields.push('Average Income');
    if (business.costOfGoods === undefined || business.costOfGoods === null) missingFields.push('Cost of Goods');
    if (business.rentForBusiness === undefined || business.rentForBusiness === null) missingFields.push('Rent for Business');
    if (business.salaries === undefined || business.salaries === null) missingFields.push('Salaries');
    if (business.transportForBusinessStock === undefined || business.transportForBusinessStock === null) {
      missingFields.push('Transport for Business Stock');
    }
  }

  // 5. Validate Confirmations/Declarations (CRITICAL - Must be confirmed)
  if (!application.confirmations) {
    errors.push('Declarations are not confirmed');
    missingFields.push('Declarations');
  } else {
    const confirmations = application.confirmations.declarations;
    if (!confirmations.membersConfirm) missingFields.push('Members Confirmation');
    if (!confirmations.correctInformationConfirm) missingFields.push('Information Accuracy Confirmation');
    if (!confirmations.liabilityConfirm) missingFields.push('Liability Confirmation');
    if (!confirmations.fundsEligibleConfirm) missingFields.push('Funds Eligibility Confirmation');
  }

  // 6. Check application progress
  if (application.generalDetails.applicationProgress && application.generalDetails.applicationProgress < 6) {
    warnings.push('Application progress indicates not all steps are completed');
  }

  return {
    isValid: errors.length === 0 && missingFields.length === 0,
    errors,
    missingFields: [...new Set(missingFields)], // Remove duplicates
    warnings
  };
}

// Helper function to check if a file is valid
function isValidFileObject(file: ValidFile | undefined): boolean {
  if (!file) return false;
  
  // Check if it's a File object (has size property)
  if (typeof file === 'object' && 'size' in file && typeof file.size === 'number') {
    return file.size > 0;
  }
  
  // Check if it's a file object with fid, filename, or url
  if (typeof file === 'object') {
    const fileObj = file as { fid?: number; filename?: string; url?: string };
    return !!(fileObj.fid || fileObj.filename || fileObj.url);
  }
  
  return false;
}