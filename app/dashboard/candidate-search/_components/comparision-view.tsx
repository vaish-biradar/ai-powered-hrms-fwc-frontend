import { useEffect, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  compareStateAtom,
  bookmarkedCandidatesAtom,
  selectedJobDescriptionAtom,
  sidebarAtom,
} from '@/store/candidatesearch-atom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/app/dashboard/_services/api-service';

const ComparePage = () => {
  const compareActive = useAtomValue(compareStateAtom);
  const bookmarked = useAtomValue(bookmarkedCandidatesAtom);
  const selectedJob = useAtomValue(selectedJobDescriptionAtom);
  const setCompareActive = useSetAtom(compareStateAtom);
  const [compareResult, setCompareResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useAtom(sidebarAtom);

  useEffect(() => {
    if (!compareActive || bookmarked.size === 0 || !selectedJob) return;
console.log("Fetching comparison data...");
console.log(bookmarked);


    const fetchComparison = async () => {
      try {
        setLoading(true);
        const result = await apiService.compareCandidates(
          selectedJob.id,
          Array.from(bookmarked)
        );
        setCompareResult(result.markdown);
      } catch (error) {
        toast.error("Something went wrong.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [compareActive, bookmarked, selectedJob]);

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
    <div className="w-full px-2 md:px-6 ">
      <Card className="w-full relative">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSidebar(!showSidebar)}
          className="absolute top-2 -left-4"
        >
          {showSidebar ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </Button>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl md:text-2xl font-bold">
              Candidate Comparison
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setCompareActive(false)}
              className="gap-2 self-start"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-220px)] w-full">
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
                  Please bookmark candidates and select a job description to compare.
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparePage;