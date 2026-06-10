interface UserDetails {
    jobTitle?: string;
    mobilePhone?: string;
}

export async function getUserDetails(accessToken: string): Promise<UserDetails> {
        const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=jobTitle,mobilePhone", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
         
            if (!response.ok) {
                throw new Error("Failed to fetch user details");
            }
         
            return response.json() as Promise<UserDetails>;
        }