"use server";

import { getTranslations } from "next-intl/server";

import { sendApplicationEmail } from "@/lib/api/application/email";
import { getApplicationPdfMetadata, getApplicationPdfBlob } from "@/lib/api/application/pdf";
import { getProfile } from "@/lib/api/profile";
import type { EmailRequest } from "@/lib/api/schema/application/application.schema";

export interface ActionResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

export async function getPdfBlobAction(applicationId: string): Promise<ActionResponse> {
  try {
    const response = await getApplicationPdfBlob(applicationId);
    
    if (!response.data?.content) {
      return {
        success: false,
        error: "PDF content is not available for this application"
      };
    }

    return {
      success: true,
      data: {
        content: response.data.content,
        filename: response.data.filename || `Application-${applicationId}.pdf`,
        mimeType: response.data.mime_type || "application/pdf",
        size: response.data.size
      }
    };
  } catch (error) {
    console.error("Error getting PDF blob:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get PDF blob"
    };
  }
}

export async function getPdfDownloadLinkAction(applicationId: string): Promise<ActionResponse> {
  try {
    const response = await getApplicationPdfMetadata(applicationId);
    
    if (!response.data?.pdf_available) {
      return {
        success: false,
        error: "PDF is not available for this application"
      };
    }

    return {
      success: true,
      data: {
        downloadUrl: response.data.download_url,
        blobUrl: response.data.blob_url,
        filename: response.data.filename || `Application-${applicationId}.pdf`
      }
    };
  } catch (error) {
    console.error("Error getting PDF download link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get PDF download link"
    };
  }
}

export async function sendApplicationEmailAction(
  applicationId: string, 
  email?: string
): Promise<ActionResponse> {
  const t = await getTranslations("ApplyPage.DonePage");
  
  try {
    // Get user profile to check for email
    const profile = await getProfile();
    const userEmail = email || profile.data?.email;

    if (!userEmail) {
      return {
        success: false,
        error: t("errors.no-email")
      };
    }

    // Prepare email request
    const emailData: EmailRequest = {
      email: userEmail
    };

    // Send email via API
    const response = await sendApplicationEmail(applicationId, emailData);

    return {
      success: true,
      message: t("email.success", { email: userEmail }),
      data: response
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : t("errors.email-failed")
    };
  }
}

export async function checkUserEmailAction(): Promise<ActionResponse> {
  try {
    const profile = await getProfile();
    
    return {
      success: true,
      data: {
        hasEmail: !!profile.data?.email,
        email: profile.data?.email
      }
    };
  } catch (error) {
    console.error("Error checking user email:", error);
    return {
      success: false,
      error: "Failed to check user profile"
    };
  }
}