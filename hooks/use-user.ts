import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAtom } from "jotai";
import { userAtom} from "@/store/user-atom";

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  mobilePhone?: string;
  jobTitle?: string;
  role?: 'HR' | 'Employee';
}

interface ExtendedSession {
  user: ExtendedUser;
  accessToken?: string;
  expires: string;
}

export const useUserStore = () => {
  const { data: session, status } = useSession();
  const [user, setUser] = useAtom(userAtom);

  useEffect(() => {
  

    if (status === "authenticated" && session) {
      const sessionData = session as ExtendedSession;

      
      setUser({
        id: sessionData.user?.id || '',
        name: sessionData.user?.name || '',
        email: sessionData.user?.email || '',
        image: sessionData.user?.image || '',
        phone: sessionData.user?.mobilePhone || "+91 123-345-****",
        jobTitle: sessionData.user?.jobTitle || "User",
        role: sessionData.user?.role || 'Employee',
        accessToken: sessionData.accessToken || '',
        expires: sessionData.expires ? new Date(sessionData.expires).getTime() : null,
      });

   
    } else {
      setUser(null);
    }
  }, [session, status, setUser]);

  return { user, status };
};
