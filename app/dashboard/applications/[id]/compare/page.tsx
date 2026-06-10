
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

import { apiService } from '@/app/dashboard/_services/api-service';
import Header from '@/app/dashboard/_components/app-header';

const ComparePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids');
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  console.log("ID:", id);
  console.log("IDs:", ids);


  const [compareResult, setCompareResult] = useState('');
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!id || !ids) return;

    const jd_id = Array.isArray(id) ? id[0] : id;
    const candidateIds = Array.isArray(ids) ? ids : ids.split(',');

    const fetchComparison = async () => {
      try {
        setLoading(true);
        const result = await apiService.compareCandidates(jd_id, candidateIds);
        setCompareResult(result.markdown);
      } catch (error) {
        toast.error("Something went wrong.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [id, ids]);

  const ComparisonSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <div className="mt-6">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full mt-2" />
        <Skeleton className="h-6 w-2/3 mt-2" />
      </div>
    </div>
  );

  return (
    <div className="w-full px-2 md:px-6 py-16">
      <Header title="Compare Candidates">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </Header>



      <ScrollArea className="h-full w-full">
        {loading ? (
          <ComparisonSkeleton />
        ) : compareResult ? (
          <div className="w-full overflow-x-auto">
            <div className="prose max-w-none prose-sm dark:prose-invert px-0 md:px-2 py-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ ...props }) => (
                    <div className="overflow-auto mb-5 rounded-md">
                      <table className="min-w-full table-auto border border-border text-sm">
                        {props.children}
                      </table>
                    </div>
                  ),
                  th: ({ ...props }) => (
                    <th className="bg-muted px-4 py-2 text-left font-semibold border border-border">
                      {props.children}
                    </th>
                  ),
                  td: ({ ...props }) => (
                    <td className="px-4 py-2 border border-border align-top">
                      {props.children}
                    </td>
                  ),
                  h2: ({ ...props }) => (
                    <h2 className="text-xl font-semibold mt-6 mb-3 border-b pb-2" {...props} />
                  ),
                  h3: ({ ...props }) => (
                    <h3 className="text-lg font-medium mt-4 mb-2 text-indigo-600" {...props} />
                  ),
                }}
              >
                {compareResult}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No comparison results available.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please pass candidate IDs and job ID in the URL to compare.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ComparePage;
