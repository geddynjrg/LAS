import { z } from 'zod';

/**
 * File data schema for uploaded documents
 * Note: API returns flexible structure, some fields may be missing
 */
export const FileDataSchema = z
  .object({
    fid: z
      .union([z.number(), z.string()])
      .describe('File ID (can be number or string)'),
    uuid: z.string().optional().describe('File UUID'),
    filename: z.string().optional().describe('Original filename'),
    uri: z.string().optional().describe('File URI'),
    url: z.string().optional().describe('Public URL to access the file'),
    filemime: z.string().optional().describe('MIME type of the file'),
    filesize: z
      .union([z.number(), z.string()])
      .optional()
      .describe('File size in bytes'),
  })
  .passthrough(); // Allow additional fields

/**
 * Taxonomy term schema for categorized data
 * Note: API returns IDs as strings, some fields may be missing
 */
export const TaxonomyTermSchema = z
  .object({
    tid: z
      .union([z.number(), z.string()])
      .describe('Term ID (can be number or string)'),
    name: z.string().describe('Term name'),
    vid: z.union([z.number(), z.string()]).optional().describe('Vocabulary ID'),
    description: z.string().nullable().optional().describe('Term description'),
    uuid: z.string().optional().describe('Term UUID'),
  })
  .passthrough(); // Allow additional fields

/**
 * Group member confirmation info schema
 */
export const MemberConfirmationInfoSchema = z.object({
  confirmation_status: z
    .enum(['pending', 'sent', 'confirmed', 'failed', 'declined'])
    .describe('Current SMS confirmation status'),
  status: z
    .enum(['pending', 'confirmed'])
    .describe('Current SMS response status'),
  sent_at: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .describe('Unix timestamp when SMS was sent (can be number or string)'),
  confirmed_at: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .describe('Unix timestamp when member confirmed (can be number or string)'),
  is_confirmed: z.boolean().describe('Whether the member has confirmed'),
  is_declined: z.boolean().describe('Whether the member has declined'),
  urls: z.object({
    api: z
      .string()
      .url()
      .describe('REST API endpoint URL for programmatic confirmation'),
    frontend: z
      .string()
      .url()
      .describe('Frontend application URL for user confirmation'),
  }),
});

/**
 * Group member detail schema
 * Note: API returns IDs as strings
 */
export const GroupMemberDetailSchema = z.object({
  id: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Member entity ID (can be number or string)'),
  name: z.string().optional(),
  id_number: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  phone_number: z.string().optional(),
  economic_activity: z.string().optional(),
  position: TaxonomyTermSchema.optional(),
  photo_member_id: FileDataSchema.optional(),
  person_with_disability: z.boolean().optional(),
  requires_confirmation: z
    .boolean()
    .optional()
    .describe('Whether this member requires SMS confirmation'),
  pwd_number: z.string().nullable().optional(),
  certificate_disability: FileDataSchema.optional(),
  confirmation: MemberConfirmationInfoSchema.optional(),
});

/**
 * Application detail schema for individual applications
 * Note: API returns IDs as strings and timestamps as strings/numbers
 */
export const ApplicationDetailSchema = z.object({
  id: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Entity ID (can be number or string)'),
  uuid: z.string().optional().describe('Entity UUID'),
  application_id: z.string().optional().describe('Application ID'),
  status: z
    .enum([
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'disbursed',
      'closed',
    ])
    .optional()
    .describe('Application status'),
  created: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Creation timestamp (unix timestamp or string)'),
  changed: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Last modified timestamp (unix timestamp or string)'),
  owner: z
    .object({
      id: z
        .union([z.number(), z.string()])
        .optional()
        .describe('User ID (can be number or string)'),
      email: z
        .string()
        .email()
        .nullable()
        .optional()
        .describe('User email (can be null)'),
      name: z.string().optional().describe('User name'),
    })
    .optional(),
  group_data: z
    .object({
      group_name: z.string().optional(),
      group_registration_number: z.string().optional(),
      date_registered: z
        .string()
        .optional()
        .describe('Date in YYYY-MM-DD format'),
      group_registration_certificate: FileDataSchema.optional(),
      list_of_members_certificate: FileDataSchema.optional(),
      group_meeting_minutes: z.array(FileDataSchema).optional(),
      group_background: z.array(TaxonomyTermSchema).optional(),
      key_activities: z.array(TaxonomyTermSchema).optional(),
      value_chain: z.array(TaxonomyTermSchema).optional(),
      table_banking_duration: z.string().nullable().optional(),
      monthly_share_contribution: z
        .union([z.number(), z.string()])
        .nullable()
        .optional(),
      total_amount_loaned: z
        .union([z.number(), z.string()])
        .nullable()
        .optional(),
      total_revolving_fund: z
        .union([z.number(), z.string()])
        .nullable()
        .optional(),
      other_activities: z.string().nullable().optional(),
      group_credit_history: z
        .array(FileDataSchema)
        .optional()
        .describe('Group credit history documents'),
    })
    .optional(),
  location: z
    .object({
      county: TaxonomyTermSchema.optional(),
      constituency: TaxonomyTermSchema.optional(),
      ward: z.string().optional(),
      meeting_point: z.string().nullish(),
      nearest_landmark: z.string().nullish(),
    })
    .optional(),
  nature_of_group: z.enum(['youth', 'pwd', 'women']).optional(),
  group_members: z.array(GroupMemberDetailSchema).optional(),
  loan_conditions: z
    .object({
      loan_type: TaxonomyTermSchema.nullable().optional(),
      loan_amount: z.union([z.number(), z.string()]).nullable().optional(),
      proposed_repayment_period: z
        .union([z.number(), z.string()])
        .nullable()
        .optional(),
      institution_type: TaxonomyTermSchema.nullable().optional(),
      bank_name: TaxonomyTermSchema.nullable().optional(),
      bank_branch: z.string().nullable().optional(),
      bank_account_number: z.string().nullable().optional(),
    })
    .optional(),
  proposed_business: z
    .object({
      nature_of_business: z
        .enum(['startup', 'expansion'])
        .nullable()
        .optional(),
      business_type: z.array(TaxonomyTermSchema).optional(),
      years_in_operation: z
        .union([z.number(), z.string()])
        .nullable()
        .optional()
        .describe('Years in operation (can be number or string)'),
      average_income: z.union([z.number(), z.string()]).nullable().optional(),
      expenses: z.array(z.record(z.unknown())).optional(),
    })
    .optional(),
  rejection_details: z
    .object({
      rejection_reason: z
        .enum([
          'incomplete_information',
          'missing_documents',
          'eligibility_criteria',
          'duplicate_application',
          'insufficient_collateral',
          'poor_credit_history',
          'member_declined',
          'other',
        ])
        .optional(),
      rejection_message: z.string().optional(),
    })
    .nullable()
    .optional(),
});

/**
 * Pagination metadata schema
 */
export const PaginationMetaSchema = z.object({
  total_count: z.number().optional().describe('Total number of applications'),
  limit: z.number().optional().describe('Number of items per page'),
  offset: z.number().optional().describe('Number of items to skip'),
  has_more: z
    .boolean()
    .optional()
    .describe('Whether there are more items available'),
});

/**
 * User info schema
 * Note: API returns IDs as strings and email can be null
 */
export const UserInfoSchema = z.object({
  id: z
    .union([z.number(), z.string()])
    .optional()
    .describe('User ID (can be number or string)'),
  name: z.string().optional().describe('User name'),
  email: z
    .string()
    .email()
    .nullable()
    .optional()
    .describe('User email (can be null)'),
});

/**
 * Applications list response schema
 */
export const ApplicationsListResponseSchema = z.object({
  success: z
    .boolean()
    .optional()
    .describe('Whether the request was successful'),
  data: z
    .array(ApplicationDetailSchema)
    .optional()
    .describe('Array of application details'),
  meta: PaginationMetaSchema.optional().describe('Pagination metadata'),
  user: UserInfoSchema.optional().describe('User information'),
});

/**
 * Applications list error schema
 */
export const ApplicationsListErrorSchema = z.object({
  error: z.string().optional().describe('Error type'),
  message: z.string().optional().describe('Error message'),
});

/**
 * Query parameters for applications list
 */
export const ApplicationsListQuerySchema = z.object({
  status: z
    .enum([
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'disbursed',
      'closed',
    ])
    .optional()
    .describe('Filter applications by status'),
  application_id: z
    .string()
    .optional()
    .describe('Filter applications by application ID'),
  limit: z
    .number()
    .optional()
    .describe('Number of applications to return per page'),
  offset: z.number().optional().describe('Number of applications to skip'),
});

// Export types
export type ApplicationDetail = z.infer<typeof ApplicationDetailSchema>;
export type ApplicationsListResponse = z.infer<
  typeof ApplicationsListResponseSchema
>;
export type ApplicationsListError = z.infer<typeof ApplicationsListErrorSchema>;
export type ApplicationsListQuery = z.infer<typeof ApplicationsListQuerySchema>;
export type FileData = z.infer<typeof FileDataSchema>;
export type TaxonomyTerm = z.infer<typeof TaxonomyTermSchema>;
export type GroupMemberDetail = z.infer<typeof GroupMemberDetailSchema>;
export type MemberConfirmationInfo = z.infer<
  typeof MemberConfirmationInfoSchema
>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type UserInfo = z.infer<typeof UserInfoSchema>;
