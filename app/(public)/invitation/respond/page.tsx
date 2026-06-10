"use client";
import {  useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function InvitationResponsePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const action = searchParams.get("action");
  const panel=searchParams.get("panel");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof token === "string" && (action === "accept" || action === "reject") && panel) {
      handleResponse(token, action,panel);
    } else {
      setStatus("error");
      setMessage("Invalid or missing invitation parameters.");
    }
  }, [token, action,panel]);

  const handleResponse = async (token: string, action: string,panel:string) => {
    try {
      setStatus("loading");
      const res = await axios.post("/api/panels/invitation-respond", { token, action ,panel});
      setStatus("success");
      setMessage(res.data.message || `Invitation ${action}ed successfully.`);
      toast("success", {
  
        description: res.data.message,
      });
    } catch (err: unknown) {
      setStatus("error");
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage("Something went wrong.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="p-6 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="animate-spin h-6 w-6 mx-auto text-gray-600" />
              <p>Processing your response...</p>
            </>
          )}

          {status === "success" && (
            <p className="text-green-600 font-semibold">{message}</p>
          )}

          {status === "error" && (
            <p className="text-red-600 font-semibold">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
