"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { useAtom } from "jotai";
import { similarityAtom, jdTitleAtom, resumeIDAtom } from "@/store/career-atom";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import rehypeRaw from "rehype-raw";

interface AnalysisContentProps {
  jobId: string;
}

export const AnalysisContent = ({ jobId }: AnalysisContentProps) => {
  const [resumeId] = useAtom(resumeIDAtom);
  const [similarity] = useAtom(similarityAtom);
  const [jdTitle] = useAtom(jdTitleAtom);

  const [analysisData, setAnalysisData] = useState("");
  const [loading, setLoading] = useState(true);
  const [mainLoading, setMainLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Format the content as it comes in
  const formatChunk = (chunk: string) => {
    return chunk
      .replace(/\n#{2,6}\s/g, "\n\n$&") // Add extra line before headers
      .replace(/(\*\*[^*]+\*\*:)/g, "\n$1") // Add line break before bold text with colon
      .replace(/\n\n\n+/g, "\n\n"); // Normalize multiple newlines
  };

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current && loading) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [analysisData, loading]);

  // Fetch analysis data
  useEffect(() => {
    if (!jobId || !similarity || !jdTitle || !resumeId) {
      setLoading(false);
      setMainLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchAnalysis = async () => {
      try {
        setAnalysisData("");

        const response = await fetch(
          "http://localhost:8000/analysis/candidate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              resume_id: resumeId,
              jd_id: jobId,
              similarity,
              jd_title: jdTitle,
            }),
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        setMainLoading(false);

        // Process the stream chunk by chunk
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode and format the chunk
          const chunk = decoder.decode(value, { stream: true });
          const formattedChunk = formatChunk(chunk);

          // Update state with the new chunk
          setAnalysisData(prevData => prevData + formattedChunk);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error fetching analysis:", error);
          setError(`Error: ${(error as Error).message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();

    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, [jobId, similarity, jdTitle, resumeId]);

  // Memoize markdown components to prevent unnecessary re-renders
  const markdownComponents = useMemo(() => ({
    h2: ({ ...props }) => (
      <h2 className="text-xl font-semibold mt-6 mb-3 border-b pb-2" {...props} />
    ),
    h3: ({ ...props }) => (
      <h3 className="text-lg font-medium mt-4 mb-2 text-indigo-600" {...props} />
    ),
    table: ({ ...props }) => (
      <div className="overflow-x-auto border my-4 bg-background w-full">
        <table className="min-w-full" {...props} />
      </div>
    ),
    th: ({ ...props }) => (
      <th
        className="p-1 bg-muted-foreground text-muted text-left text-sm font-semibold uppercase tracking-wider"
        {...props}
      />
    ),
    td: ({ children, ...props }: { children?: React.ReactNode }) => {
      return (
        <td
          className="p-1 whitespace-normal text-sm text-primary border-t border-gray-100 text-left"
          {...props}
        >
          {children}
        </td>
      );
    },
    ul: ({ ...props }) => (
      <ul className="list-disc pl-6 space-y-1 my-2" {...props} />
    ),
    li: ({ ...props }) => (
      <li className="text-sm leading-relaxed" {...props} />
    ),
    code: ({ ...props }) => (
      <code
        className="block bg-gray-50 p-4 my-2 text-sm font-mono text-primary break-words"
        {...props}
      />
    ),
    a: ({ ...props }) => (
      <a
        className="text-indigo-600 hover:text-indigo-800 underline break-all"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
  }), []);

  // Render loading state
  const renderLoading = () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
    </div>
  );

  // Render error state
  const renderError = () => (
    <Card className="border-destructive/50 bg-destructive/10">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Error Loading Analysis</h3>
        </div>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
          variant="destructive"
        >
          Retry
        </Button>
      </CardContent>
    </Card>
  );

  // Render main content with markdown
  const renderContent = () => {
    if (loading && !analysisData) {
      return renderLoading();
    }

    if (error && !analysisData) {
      return renderError();
    }

    return (
      <div className="prose prose-sm max-w-none p-2">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={markdownComponents}
        >
          {analysisData}
        </ReactMarkdown>

        {/* Show loading indicator during streaming */}
        {loading && (
          <div className="flex items-center justify-center gap-2 my-4 py-3 bg-muted/30 rounded-md">
            <div className="w-4 h-4 rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-muted-foreground">Generating insights...</span>
          </div>
        )}
      </div>
    );
  };

  // Render main loading state
  const renderMainLoading = () => (
    <div className="space-y-4 p-4 flex-1">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-32 w-full rounded-md" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-20 w-full rounded-md" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-32 w-full rounded-md" />
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <Separator className="mb-4" />

      {/* Main content area */}
      {mainLoading ? (
        renderMainLoading()
      ) : (
        <ScrollArea className="flex-1 rounded-md px-1" scrollHideDelay={300} ref={scrollRef}>
          {renderContent()}
        </ScrollArea>
      )}
    </div>
  );
};