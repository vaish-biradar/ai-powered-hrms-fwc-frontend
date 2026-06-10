"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, Send, X, Bot, CircleUserRound, Minimize2, Maximize2, Copy, Check, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Separator } from "@/components/ui/separator";
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import axios from "axios";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Message {
  role: "user" | "bot" | "loading";
  content: string;
  id?: string;
}

const QUICK_MESSAGES = [
  { label: "About FWC", message: "Can you please tell me about FWC?" },
  { label: "Tasks I Perform", message: "What tasks do you perform?" },
  { label: "Application Status", message: "Can you help me check the status of my application?" },
  { label: "Open Job Roles", message: "What job roles are currently available?" },
  { label: "Skills Required", message: "What are the key skills required for current job openings?" },
  { label: "How to contact", message: "How to contact FWC?" }
];

const DEFAULT_MESSAGES: Message[] = [
  {
    role: "bot",
    content: "Hi there! I'm the FWC Assistant. Quick access buttons below can help you get started. What can I help you with today?",
    id: "welcome-msg"
  }
];

const MarkdownRenderer = ({ children }: { children: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw, rehypeSanitize]}
    components={{
      h1: ({ ...props }) => <h1 className="text-sm font-bold mb-2" {...props} />,
      h2: ({ ...props }) => <h2 className="text-xs font-semibold mb-1" {...props} />,
      h3: ({ ...props }) => <h3 className="text-xs font-medium mb-1" {...props} />,
      p: ({ ...props }) => <p className="mb-2" {...props} />,
      ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
      ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
      li: ({ ...props }) => <li className="mb-1" {...props} />,
      a: ({ ...props }) => (
        <a
          className="text-blue-300 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      ),
      code: ({ ...props }) => (
        <pre className="bg-gray-100 rounded p-2 mb-2 overflow-x-auto text-sm">
          <code className="font-mono" {...props} />
        </pre>
      ),
      blockquote: ({ ...props }) => (
        <blockquote
          className="border-l-4 border-gray-300 pl-4 italic my-2"
          {...props}
        />
      )
    }}
  >
    {children}
  </ReactMarkdown>
);

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const cardRef = useRef(null);
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        cardRef.current &&
        !(cardRef.current as HTMLElement).contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button[aria-label="Open chat"]')
      ) {
        setIsOpen(false);
        setIsFullScreen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const generateMessageId = () => {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const sendMessage = async (messageContent?: string) => {
    const messageToSend = messageContent || input;
    if (!messageToSend.trim() || loading) return;

    const newMessage: Message = { 
      role: "user", 
      content: messageToSend,
      id: generateMessageId()
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { 
      role: "loading", 
      content: "...",
      id: "loading-msg"
    }]);

    try {
      const response = await axios.post(
        "/api/proxy/dohragent/agent",
        { prompt: messageToSend },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setMessages((prev) =>
        prev
          .filter((msg) => msg.role !== "loading")
          .concat({ 
            role: "bot", 
            content: response.data.response,
            id: generateMessageId()
          })
      );
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev
          .filter((msg) => msg.role !== "loading")
          .concat({ 
            role: "bot", 
            content: "⚠️ Error fetching response. Please try again.",
            id: generateMessageId()
          })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsFullScreen(false);

    if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  };

  const clearChat = () => {
    setMessages(DEFAULT_MESSAGES);
    toast("Chat cleared",{
      description: "All messages have been cleared.",
      duration: 2000,
    });
  };

  const copyMessageContent = (content: string, id: string | undefined) => {
    if (!id) return;
    
    navigator.clipboard.writeText(content);
    setCopied({ ...copied, [id]: true });
    
    setTimeout(() => {
      setCopied((prev) => ({ ...prev, [id]: false }));
    }, 2000);

    toast("Copied to clipboard",{
      description: "Message content has been copied to your clipboard.",
      duration: 2000,
    });
  };

  return (
    <TooltipProvider>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            className="rounded-full h-14 w-14 shadow-lg transition-all duration-300 ease-in-out hover:scale-110"
            onClick={toggleChat}
            size="icon"
            aria-label="Open chat"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </div>
      )}

      {isOpen && (
        <div className="fixed z-80 transition-opacity duration-300 ease-in-out opacity-100">
          <Card
            ref={cardRef}
            className={`fixed shadow-xl z-80 border p-0 transition-all duration-300 ease-in-out
              ${isFullScreen
                ? 'w-screen h-screen top-0 left-0 right-0 bottom-0 rounded-none m-0'
                : 'right-6 bottom-6 w-[95vw] max-w-[400px] rounded-lg h-[80vh] max-h-[600px]'
              }`}
          >
            <CardHeader className="bg-primary text-secondary rounded-t-lg py-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" /> FWC Assistant
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  aria-label="Clear chat"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullScreen}
                  aria-label={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                >
                  {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
         
                <Button
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  size="icon"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <ScrollArea className={`overflow-y-auto py-1 px-4 text-xs 
              ${isFullScreen ? 'h-[calc(100vh-200px)]' : 'h-[calc(80vh-140px)]'}`}>
              <div className="transition-opacity duration-300 opacity-100">
                {messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`flex items-start mb-3 w-[85%] group transition-opacity duration-300 ease-in-out opacity-100
                      ${msg.role === "user" ? "justify-end ml-auto" : "justify-start mr-auto"}`}
                  >
                    {(msg.role === "bot" || msg.role === "loading") && (
                      <Bot className="h-6 w-6 mr-2 mt-1 text-primary flex-shrink-0" />
                    )}
                    <div
                      className={`p-2 rounded max-w-[85%] relative 
                        ${msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"}`}
                    >
                      <MarkdownRenderer>{Array.isArray(msg.content) ? msg.content.join('') : msg.content}</MarkdownRenderer>
                      
                      {msg.role !== "user" && msg.role !== "loading" && (
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6 rounded-full bg-background"
                                onClick={() => copyMessageContent(msg.content, msg.id)}
                              >
                                {copied[msg.id || ''] ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {copied[msg.id || ''] ? "Copied!" : "Copy message"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <CircleUserRound className="h-6 w-6 ml-2 mt-1 text-primary flex-shrink-0" />
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator />

            <CardContent className="p-2">
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_MESSAGES.map((quickMsg, index) => (
                  <div
                    key={index}
                    className="transition-opacity duration-300 opacity-100"
                  >
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => sendMessage(quickMsg.message)}
                    >
                      {quickMsg.label}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="pt-1 pb-4">
              <div className="flex w-full items-center space-x-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here..."
                  className="flex-1"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="transition-all duration-300 ease-in-out"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <div className="transition-transform duration-300 hover:scale-110 active:scale-90">
                      <Send className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </TooltipProvider>
  );
}