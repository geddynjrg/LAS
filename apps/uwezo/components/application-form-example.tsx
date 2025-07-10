"use client";

import { useApplicationData } from "@/hooks/useApplicationData";

export function ApplicationFormExample() {
  const { applicationData, updateGroupData, updateLoanConditions, isComplete } =
    useApplicationData();

  const handleGroupNameChange = (value: string) => {
    updateGroupData({ groupName: value });
  };

  const handleLoanAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    updateLoanConditions({ loanAmount: amount });
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Application Form Example
        </h2>
        <p className="mt-2 text-gray-600">
          This demonstrates the new application data hook and schemas
        </p>
      </div>

      <div className="space-y-6">
        {/* Group Data Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Group Information</h3>
          <div className="space-y-2">
            <label
              htmlFor="groupName"
              className="block text-sm font-medium text-gray-700"
            >
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={applicationData.groupData.groupName}
              onChange={(e) => handleGroupNameChange(e.target.value)}
              placeholder="Enter group name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Loan Conditions Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Loan Information</h3>
          <div className="space-y-2">
            <label
              htmlFor="loanAmount"
              className="block text-sm font-medium text-gray-700"
            >
              Loan Amount (KES)
            </label>
            <input
              id="loanAmount"
              type="number"
              value={applicationData.loanConditions.loanAmount}
              onChange={(e) => handleLoanAmountChange(e.target.value)}
              placeholder="Enter loan amount"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Display */}
        <div className="space-y-2 rounded-md bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            Application Status:{" "}
            <span className="font-medium">{applicationData.status}</span>
          </p>
          <p className="text-sm text-gray-600">
            Form Complete:{" "}
            <span className="font-medium">{isComplete ? "Yes" : "No"}</span>
          </p>
        </div>

        {/* Submit Button */}
        <button
          disabled={!isComplete}
          className={`w-full rounded-md px-4 py-2 font-medium transition-colors ${
            isComplete
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          {isComplete ? "Submit Application" : "Complete All Fields"}
        </button>
      </div>
    </div>
  );
}
