import { JobCard } from '@/app/(public)/careers/_components/job-card';
import { Separator } from '@/components/ui/separator';
import { useAtomValue } from 'jotai';
import { resumeUploadedAtom, matchingJobsAtom, jobOpeningsAtom } from '@/store/career-atom';
import { JobListingsSectionProps } from '@/types/careers-types';

export const JobListingsSection = ({ onApply, onGenerateAnalysis, onMockInterview }: JobListingsSectionProps) => {
  const jobOpenings = useAtomValue(jobOpeningsAtom);
  const matchingJobs = useAtomValue(matchingJobsAtom);
  const resumeUploaded = useAtomValue(resumeUploadedAtom);

  const jobsToShow = resumeUploaded ? matchingJobs : jobOpenings;

  return (
    <section className="py-8">
      {resumeUploaded ? (
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight mb-1">Job Match Results</h2>
          <p className="text-sm text-gray-600">
            Based on your resume, here are your top matches from our open positions
          </p>
        </div>
      ) : (
        <h2 className="text-3xl font-bold tracking-tight mb-6">Job Opportunities</h2>
      )}

      {jobsToShow.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {jobsToShow.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isMatched={resumeUploaded}
              onApply={resumeUploaded ? onApply : undefined}
              onGenerateAnalysis={resumeUploaded ? onGenerateAnalysis : undefined}
              onMockInterview={resumeUploaded ? onMockInterview : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-10 space-y-4">
          <p>
            {resumeUploaded
              ? 'No matching jobs found for your resume.'
              : 'No job openings available at the moment.'}
          </p>
          {!resumeUploaded && (
            <p className="text-sm text-gray-600">
              You can{' '}
              <span className="text-primary font-semibold">
                upload your resume
              </span>{' '}
              so that we can consider you for future opportunities.
            </p>
          )}
        </div>
      )}
      <Separator className="mt-8" />
    </section>
  );
};
