// lib/azure.ts
import AzureADProvider from 'next-auth/providers/azure-ad';

export const azureProvider = AzureADProvider({
  clientId: process.env.AZURE_AD_CLIENT_ID!,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  tenantId: process.env.AZURE_AD_TENANT_ID!,
  authorization: {
    params: {
      // Request additional scopes (if Azure AD is configured to return these)
      scope: 'openid profile email User.Read offline_access Mail.Send OnlineMeetings.Read OnlineMeetings.ReadWrite Calendars.Read Calendars.ReadWrite',
    },
  },
  userinfo: "https://graph.microsoft.com/oidc/userinfo",
});


