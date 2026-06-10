"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { chatMockInterview, saveMockInterview } from "@/app/(public)/careers/_services/api-service";
import { MockInterviewMessage, MatchedJob } from "@/types/careers-types";

interface MockInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedJob: MatchedJob | null;
  resumeId: string;
}

export function MockInterviewDialog({ open, onOpenChange, selectedJob, resumeId }: MockInterviewDialogProps) {
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<MockInterviewMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingBaseMessageRef = useRef("");
  const recognizedFinalTextRef = useRef("");
  const resolvedJdId = selectedJob?.jd_id || selectedJob?.id || "";

  const canStart = useMemo(() => {
    return Boolean(resolvedJdId && resumeId && candidateName.trim() && candidateEmail.trim());
  }, [resolvedJdId, resumeId, candidateName, candidateEmail]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const isSpeechRecognitionAvailable =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore browser speech synthesis failures silently.
    }
  };

  const toggleRecording = () => {
    if (!isSpeechRecognitionAvailable) {
      toast.warning("Voice input is not supported in this browser.");
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      recordingBaseMessageRef.current = message.trim();
      recognizedFinalTextRef.current = "";
      setIsRecording(true);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Unable to capture voice. Please try again.");
    };
    recognition.onend = () => {
      setIsRecording(false);
      setMessage((prev) => prev.trim());
    };
    recognition.onresult = (event: any) => {
      let interimText = "";
      let finalChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript || "";
        if (!transcript) continue;

        if (result.isFinal) {
          finalChunk += ` ${transcript}`;
        } else {
          interimText += ` ${transcript}`;
        }
      }

      if (finalChunk.trim()) {
        recognizedFinalTextRef.current = `${recognizedFinalTextRef.current} ${finalChunk}`.trim();
      }

      const nextValue = [
        recordingBaseMessageRef.current,
        recognizedFinalTextRef.current,
        interimText.trim(),
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      setMessage(nextValue);
    };

    recognition.start();
  };

  const startInterview = async () => {
    if (!canStart || !selectedJob) {
      toast.warning("Please fill your name and email first.");
      return;
    }

    setLoading(true);
    try {
      const response = await chatMockInterview(resumeId, resolvedJdId, []);
      const next: MockInterviewMessage[] = [{ role: "assistant", content: response.reply }];
      setConversation(next);
      speakText(response.reply);
      scrollToBottom();
    } catch (error) {
      console.error(error);
      toast.error("Failed to start mock interview.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || loading || !selectedJob) return;

    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors from browser speech engine.
      }
      setIsRecording(false);
    }

    recordingBaseMessageRef.current = "";
    recognizedFinalTextRef.current = "";

    const userMessage: MockInterviewMessage = { role: "user", content: message.trim() };
    const updated = [...conversation, userMessage];
    setConversation(updated);
    setMessage("");
    setLoading(true);

    try {
      const response = await chatMockInterview(resumeId, resolvedJdId, updated);
      const withReply = [...updated, { role: "assistant" as const, content: response.reply }];
      setConversation(withReply);
      speakText(response.reply);
      if (response.should_end) {
        toast.info("Interview is complete. Please click End Interview.");
      }
      scrollToBottom();
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch interview response.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedJob || !resumeId || conversation.length === 0) {
      toast.warning("No conversation to save.");
      return;
    }

    setSaving(true);
    try {
      const msg = await saveMockInterview(
        resumeId,
        resolvedJdId,
        candidateName.trim(),
        candidateEmail.trim(),
        conversation
      );
      toast.success(msg);
      onOpenChange(false);
      setConversation([]);
      setMessage("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save transcript.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Mock Interview {selectedJob ? `- ${selectedJob.title}` : ""}</DialogTitle>
          <DialogDescription>
            JD-guided LLM interview. Save transcript and HR can review it in Transcript section.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Your name"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            disabled={conversation.length > 0}
          />
          <Input
            placeholder="Your email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            disabled={conversation.length > 0}
          />
        </div>

        {conversation.length === 0 ? (
          <div className="flex justify-end">
            <Button onClick={startInterview} disabled={!canStart || loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Start Interview
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[320px] rounded-md border p-3">
              <div className="space-y-3">
                {conversation.map((item, idx) => (
                  <div
                    key={`${item.role}-${idx}`}
                    className={`max-w-[90%] rounded-md px-3 py-2 text-sm ${
                      item.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "mr-auto bg-muted"
                    }`}
                  >
                    {item.content}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Type your answer"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <Button
                variant="outline"
                onClick={toggleRecording}
                disabled={loading || !isSpeechRecognitionAvailable}
                title={isRecording ? "Stop voice input" : "Start voice input"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              {isRecording && (
                <div className="flex items-center px-2 text-xs text-primary whitespace-nowrap">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Listening...
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => setVoiceEnabled((prev) => !prev)}
                title={voiceEnabled ? "Disable voice replies" : "Enable voice replies"}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button onClick={sendMessage} disabled={loading || !message.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleSave} disabled={saving || conversation.length === 0}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                End Interview
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
