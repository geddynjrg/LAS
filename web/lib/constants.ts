import type { Step } from '@workspace/ui/components/stepper';

export const MAX_FILE_SIZE = 30 * 1024 * 1024;

export const FILE_ACCEPT = {
  'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
  'application/pdf': ['.pdf'],
};

export const steps: Step[] = [
  { index: 1, title: 'Group data', path: '/group-data' },
  { index: 2, title: 'Group members', path: '/members' },
  { index: 3, title: 'Loan conditions', path: '/loan-conditions' },
  { index: 4, title: 'Proposed business', path: '/proposed-business' },
  { index: 5, title: 'Confirmations', path: '/confirmations' },
  { index: 6, title: 'Final review', path: '/review' },
];

export const loanTypeValues = {
  Endeleza: {
    title: 'Endeleza',
    maxLoanAmount: 500000,
  },
  Wezesha: {
    title: 'Wezesha',
    maxLoanAmount: 100000,
  },
};
