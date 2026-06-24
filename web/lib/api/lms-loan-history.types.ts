export interface LmsDebtMember {
  member_id: string;
  name?: string | null;
  phone?: string | null;
  role?: string | null;
}

export interface LmsDebtCheckResult {
  has_debt: boolean;
  can_proceed: boolean;
  check_type: 'member' | 'group' | 'repayment' | null;
  matched_value: string | null;
  group_loan_id: number | null;
  group_id: number | null;
  group_name: string | null;
  group_registration_number: string | null;
  constituency_name: string | null;
  loan_type: string | null;
  amount_issued: number;
  amount_repaid: number;
  outstanding_balance: number;
  repayment_percentage: number;
  minimum_payment_required: number;
  repayment_threshold_percent: number;
  members: LmsDebtMember[];
  group_found?: boolean;
  has_prior_financed_loan?: boolean;
  loan_cleared?: boolean;
  eligible_for_endeleza?: boolean;
  eligible_for_wezesha?: boolean;
  endeleza_min_amount?: number;
  endeleza_max_amount?: number;
  wezesha_min_amount?: number;
  wezesha_max_amount?: number;
}

export interface LmsGroupLoanStatus {
  has_debt: boolean;
  can_proceed: boolean;
  blocks_proceed: boolean;
  group_loan_id: number;
  group_name?: string | null;
  outstanding_balance: number;
  repayment_percentage: number;
  minimum_payment_required: number;
}
