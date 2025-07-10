"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useReducer,
} from "react";

// Application data types
export interface GroupData {
  groupName: string;
  groupType: string;
  groupDescription: string;
  groupLocation: string;
  groupMembers: number;
  groupLeader: string;
  groupContact: string;
}

export interface MemberData {
  id: string;
  name: string;
  idNumber: string;
  phone: string;
  email: string;
  role: string;
}

export interface ProposedBusiness {
  businessName: string;
  businessDescription: string;
  businessLocation: string;
  businessType: string;
  expectedRevenue: number;
  startDate: string;
}

export interface LoanConditions {
  loanAmount: number;
  loanPurpose: string;
  repaymentPeriod: number;
  interestRate: number;
  collateral: string;
}

export interface ApplicationData {
  id?: string;
  groupData: GroupData;
  members: MemberData[];
  proposedBusiness: ProposedBusiness;
  loanConditions: LoanConditions;
  confirmations: {
    dataAccuracy: boolean;
    termsAccepted: boolean;
    privacyAccepted: boolean;
  };
  status: "draft" | "submitted" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

// Action types
type ApplicationAction =
  | { type: "UPDATE_GROUP_DATA"; payload: Partial<GroupData> }
  | { type: "UPDATE_MEMBERS"; payload: MemberData[] }
  | { type: "ADD_MEMBER"; payload: MemberData }
  | { type: "REMOVE_MEMBER"; payload: string }
  | { type: "UPDATE_PROPOSED_BUSINESS"; payload: Partial<ProposedBusiness> }
  | { type: "UPDATE_LOAN_CONDITIONS"; payload: Partial<LoanConditions> }
  | {
      type: "UPDATE_CONFIRMATIONS";
      payload: Partial<ApplicationData["confirmations"]>;
    }
  | { type: "SET_STATUS"; payload: ApplicationData["status"] }
  | { type: "RESET_APPLICATION" }
  | { type: "LOAD_APPLICATION"; payload: ApplicationData };

// Initial state
const initialState: ApplicationData = {
  groupData: {
    groupName: "",
    groupType: "",
    groupDescription: "",
    groupLocation: "",
    groupMembers: 0,
    groupLeader: "",
    groupContact: "",
  },
  members: [],
  proposedBusiness: {
    businessName: "",
    businessDescription: "",
    businessLocation: "",
    businessType: "",
    expectedRevenue: 0,
    startDate: "",
  },
  loanConditions: {
    loanAmount: 0,
    loanPurpose: "",
    repaymentPeriod: 0,
    interestRate: 0,
    collateral: "",
  },
  confirmations: {
    dataAccuracy: false,
    termsAccepted: false,
    privacyAccepted: false,
  },
  status: "draft",
};

// Reducer function
function applicationReducer(
  state: ApplicationData,
  action: ApplicationAction,
): ApplicationData {
  switch (action.type) {
    case "UPDATE_GROUP_DATA":
      return {
        ...state,
        groupData: { ...state.groupData, ...action.payload },
        updatedAt: new Date().toISOString(),
      };
    case "UPDATE_MEMBERS":
      return {
        ...state,
        members: action.payload,
        updatedAt: new Date().toISOString(),
      };
    case "ADD_MEMBER":
      return {
        ...state,
        members: [...state.members, action.payload],
        updatedAt: new Date().toISOString(),
      };
    case "REMOVE_MEMBER":
      return {
        ...state,
        members: state.members.filter((member) => member.id !== action.payload),
        updatedAt: new Date().toISOString(),
      };
    case "UPDATE_PROPOSED_BUSINESS":
      return {
        ...state,
        proposedBusiness: { ...state.proposedBusiness, ...action.payload },
        updatedAt: new Date().toISOString(),
      };
    case "UPDATE_LOAN_CONDITIONS":
      return {
        ...state,
        loanConditions: { ...state.loanConditions, ...action.payload },
        updatedAt: new Date().toISOString(),
      };
    case "UPDATE_CONFIRMATIONS":
      return {
        ...state,
        confirmations: { ...state.confirmations, ...action.payload },
        updatedAt: new Date().toISOString(),
      };
    case "SET_STATUS":
      return {
        ...state,
        status: action.payload,
        updatedAt: new Date().toISOString(),
      };
    case "RESET_APPLICATION":
      return {
        ...initialState,
        createdAt: new Date().toISOString(),
      };
    case "LOAD_APPLICATION":
      return action.payload;
    default:
      return state;
  }
}

// Context interface
interface ApplicationDataContextProps {
  applicationData: ApplicationData;
  updateGroupData: (data: Partial<GroupData>) => void;
  updateMembers: (members: MemberData[]) => void;
  addMember: (member: MemberData) => void;
  removeMember: (memberId: string) => void;
  updateProposedBusiness: (data: Partial<ProposedBusiness>) => void;
  updateLoanConditions: (data: Partial<LoanConditions>) => void;
  updateConfirmations: (
    data: Partial<ApplicationData["confirmations"]>,
  ) => void;
  setStatus: (status: ApplicationData["status"]) => void;
  resetApplication: () => void;
  loadApplication: (data: ApplicationData) => void;
  isComplete: boolean;
}

// Context
const ApplicationDataContext = createContext<
  ApplicationDataContextProps | undefined
>(undefined);

// Provider component
export const ApplicationDataProvider: React.FC<{
  initialData?: ApplicationData;
  children: ReactNode;
}> = ({ initialData, children }) => {
  const [applicationData, dispatch] = useReducer(
    applicationReducer,
    initialData || { ...initialState, createdAt: new Date().toISOString() },
  );

  const updateGroupData = useCallback((data: Partial<GroupData>) => {
    dispatch({ type: "UPDATE_GROUP_DATA", payload: data });
  }, []);

  const updateMembers = useCallback((members: MemberData[]) => {
    dispatch({ type: "UPDATE_MEMBERS", payload: members });
  }, []);

  const addMember = useCallback((member: MemberData) => {
    dispatch({ type: "ADD_MEMBER", payload: member });
  }, []);

  const removeMember = useCallback((memberId: string) => {
    dispatch({ type: "REMOVE_MEMBER", payload: memberId });
  }, []);

  const updateProposedBusiness = useCallback(
    (data: Partial<ProposedBusiness>) => {
      dispatch({ type: "UPDATE_PROPOSED_BUSINESS", payload: data });
    },
    [],
  );

  const updateLoanConditions = useCallback((data: Partial<LoanConditions>) => {
    dispatch({ type: "UPDATE_LOAN_CONDITIONS", payload: data });
  }, []);

  const updateConfirmations = useCallback(
    (data: Partial<ApplicationData["confirmations"]>) => {
      dispatch({ type: "UPDATE_CONFIRMATIONS", payload: data });
    },
    [],
  );

  const setStatus = useCallback((status: ApplicationData["status"]) => {
    dispatch({ type: "SET_STATUS", payload: status });
  }, []);

  const resetApplication = useCallback(() => {
    dispatch({ type: "RESET_APPLICATION" });
  }, []);

  const loadApplication = useCallback((data: ApplicationData) => {
    dispatch({ type: "LOAD_APPLICATION", payload: data });
  }, []);

  // Check if application is complete
  const isComplete =
    applicationData.groupData.groupName !== "" &&
    applicationData.members.length > 0 &&
    applicationData.proposedBusiness.businessName !== "" &&
    applicationData.loanConditions.loanAmount > 0 &&
    applicationData.confirmations.dataAccuracy &&
    applicationData.confirmations.termsAccepted &&
    applicationData.confirmations.privacyAccepted;

  return (
    <ApplicationDataContext.Provider
      value={{
        applicationData,
        updateGroupData,
        updateMembers,
        addMember,
        removeMember,
        updateProposedBusiness,
        updateLoanConditions,
        updateConfirmations,
        setStatus,
        resetApplication,
        loadApplication,
        isComplete,
      }}
    >
      {children}
    </ApplicationDataContext.Provider>
  );
};

// Hook to use the context
export const useApplicationData = (): ApplicationDataContextProps => {
  const context = useContext(ApplicationDataContext);

  if (context === undefined) {
    throw new Error(
      "useApplicationData must be used within an ApplicationDataProvider",
    );
  }

  return context;
};
