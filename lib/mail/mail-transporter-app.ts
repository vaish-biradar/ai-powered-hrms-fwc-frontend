import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";

interface GraphRecipient {
  emailAddress: { address: string };
}

interface GraphMailAttachment {
  "@odata.type": "#microsoft.graph.fileAttachment";
  name: string;
  contentBytes: string;
}

interface GraphMessage {
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  toRecipients: GraphRecipient[];
  ccRecipients?: GraphRecipient[];
  attachments?: GraphMailAttachment[];
}

type GraphMailRequest = {
  message: GraphMessage;
};

// This uses Application permissions instead of delegated permissions
// It sends emails from a service account (not the logged-in user)
const getGraphClientWithAppPermissions = () => {
  const credential = new ClientSecretCredential(
    process.env.AZURE_AD_TENANT_ID!,
    process.env.AZURE_AD_CLIENT_ID!,
    process.env.AZURE_AD_CLIENT_SECRET!
  );

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken("https://graph.microsoft.com/.default");
        return token?.token ?? "";
      },
    },
  });
};

export const sendMailFromServiceAccount = async (
  to: string | string[],
  subject: string,
  text: string,
  attachments?: { filename: string; content: Buffer }[],
  cc?: string | string[],
  contentType: "Text" | "HTML" = "Text"
) => {
  try {
    const serviceEmail = process.env.SERVICE_EMAIL_ADDRESS || "hr@fwc.com";
    
    console.log('📧 [sendMailFromServiceAccount] Starting:', {
      from: serviceEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
    });

    const client = getGraphClientWithAppPermissions();

    const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({
      emailAddress: { address: email },
    }));

    const ccRecipients = cc
      ? (Array.isArray(cc) ? cc : [cc]).map((email) => ({
          emailAddress: { address: email },
        }))
      : [];

    const emailMessage: GraphMailRequest = {
      message: {
        subject,
        body: {
          contentType,
          content: text,
        },
        toRecipients: recipients,
      },
    };

    if (ccRecipients.length > 0) {
      emailMessage.message.ccRecipients = ccRecipients;
    }

    if (attachments && attachments.length > 0) {
      emailMessage.message.attachments = attachments.map((file) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: file.filename,
        contentBytes: file.content.toString("base64"),
      }));
    }

    console.log('🚀 [sendMailFromServiceAccount] Calling Graph API to send from:', serviceEmail);
    
    // Send from the service account
    await client.api(`/users/${serviceEmail}/sendMail`).post(emailMessage);
    
    console.log('✅ [sendMailFromServiceAccount] Email sent successfully');

    return { success: true };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const graphError =
      typeof err === "object" && err !== null
        ? err as { statusCode?: number; code?: string }
        : {};

    console.error('❌ [sendMailFromServiceAccount] Error:', {
      statusCode: graphError.statusCode,
      code: graphError.code,
      message: err.message,
      error: err,
    });
    return { success: false, error: err.message };
  }
};
