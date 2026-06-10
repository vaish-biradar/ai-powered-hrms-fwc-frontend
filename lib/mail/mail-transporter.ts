import { Client } from "@microsoft/microsoft-graph-client";

const getGraphClient = (accessToken: string) => {
  if (!accessToken) {
    throw new Error("Access token is required to send emails.");
  }

  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
};

export const sendMail = async (
  accessToken: string,
  to: string | string[],
  subject: string,
  text: string,
  attachments?: { filename: string; content: Buffer }[],
  cc?: string | string[] ,// <- CC recipients
  contentType: "Text" | "HTML" = "Text"
) => {
  try {
    console.log('📧 [sendMail] Starting with token:', {
      tokenStart: accessToken?.slice(0, 50) + '...' || 'MISSING',
      to: Array.isArray(to) ? to : [to],
      subject,
    });
    const client = getGraphClient(accessToken);

    const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({
      emailAddress: { address: email },
    }));

    const ccRecipients = cc
      ? (Array.isArray(cc) ? cc : [cc]).map((email) => ({
          emailAddress: { address: email },
        }))
      : [];

    const emailMessage: {
      message: {
        subject: string;
        body: {
          contentType: string;
          content: string;
        };
        toRecipients: { emailAddress: { address: string } }[];
        ccRecipients?: { emailAddress: { address: string } }[];
        attachments?: {
          "@odata.type": string;
          name: string;
          contentBytes: string;
        }[];
      };
    } = {
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

    console.log('🚀 [sendMail] Calling Graph API /me/sendMail...');
    await client.api("/me/sendMail").post(emailMessage);
    console.log('✅ [sendMail] Email sent successfully');

    return { success: true };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    // Try to read the response body if it's a stream
    let errorDetails = null;
    const detailedError =
      typeof error === 'object' && error !== null
        ? error as {
            body?: { getReader?: () => { read: () => Promise<{ value?: Uint8Array; done: boolean }> } };
            statusCode?: number;
            code?: string;
            requestId?: string;
            responseBody?: { error?: unknown };
          }
        : {};
    if (detailedError.body && typeof detailedError.body.getReader === 'function') {
      try {
        const reader = detailedError.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) result += decoder.decode(value, { stream: !done });
        }
        errorDetails = JSON.parse(result);
      } catch (e) {
        console.error('[sendMail] Could not read error body:', e);
      }
    }

    console.error('❌ [sendMail] Graph API Error - Full Details:', {
      statusCode: detailedError.statusCode,
      code: detailedError.code,
      requestId: detailedError.requestId,
      message: err.message,
      graphError: detailedError.responseBody?.error,
      parsedErrorBody: errorDetails,
      errorString: JSON.stringify(error, null, 2),
    });
    
    // Check for specific 401 errors
    if (detailedError.statusCode === 401) {
      console.error('🚨 [sendMail] 401 UNAUTHORIZED - Token may be invalid, expired, or missing Mail.Send permission');
      console.error('💡 [sendMail] Solution: Sign out completely and sign back in to get a fresh token');
      if (errorDetails) {
        console.error('📝 [sendMail] Microsoft Graph Error:', errorDetails);
      }
    }
    
    return { success: false, error: err.message };
  }
};


