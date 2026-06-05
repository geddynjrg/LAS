export interface BankBranch {
  id: number;
  branchName: string;
  bank: string;
}

const KENYA_BANK_BRANCHES_CSV_URL = '/data/kenya_all_bank_branches.csv';

/** Parse a CSV row where branch names may contain commas. Format: id,branchName,bank */
export function parseBankBranchLine(line: string): BankBranch | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const lastComma = trimmed.lastIndexOf(',');
  if (lastComma === -1) return null;

  const bank = trimmed.slice(lastComma + 1).trim();
  const rest = trimmed.slice(0, lastComma);
  const firstComma = rest.indexOf(',');
  if (firstComma === -1) return null;

  const id = parseInt(rest.slice(0, firstComma).trim(), 10);
  const branchName = rest.slice(firstComma + 1).trim();

  if (Number.isNaN(id) || !branchName || !bank) return null;

  return { id, branchName, bank };
}

export function parseKenyaBankBranchesCsv(csvText: string): BankBranch[] {
  const lines = csvText.trim().split('\n');
  return lines
    .slice(1)
    .map(parseBankBranchLine)
    .filter((item): item is BankBranch => item !== null);
}

export function getUniqueBanks(branches: BankBranch[]): string[] {
  const banksMap = new Map<string, string>();
  branches.forEach((branch) => {
    const lower = branch.bank.toLowerCase();
    if (!banksMap.has(lower)) {
      banksMap.set(lower, branch.bank);
    }
  });
  return Array.from(banksMap.values()).sort((a, b) => a.localeCompare(b));
}

export function getBranchesForBank(
  branches: BankBranch[],
  bankName: string,
): { label: string; value: string }[] {
  if (!bankName) return [];

  const lowerSelected = bankName.toLowerCase();
  return branches
    .filter((branch) => branch.bank.toLowerCase() === lowerSelected)
    .map((branch) => ({ label: branch.branchName, value: branch.branchName }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function loadKenyaBankBranches(): Promise<BankBranch[]> {
  const res = await fetch(KENYA_BANK_BRANCHES_CSV_URL);
  if (!res.ok) {
    throw new Error('Failed to fetch Kenya bank branches CSV');
  }
  const csvText = await res.text();
  return parseKenyaBankBranchesCsv(csvText);
}
