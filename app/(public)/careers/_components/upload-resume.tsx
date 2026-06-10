import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { resumeUploadedAtom, processingResumeAtom, fileNameAtom } from '@/store/career-atom';
import {ResumeUploadSectionProps} from '@/types/careers-types';
export const ResumeUploadSection = ({ onFileUpload, onResetUpload, }: ResumeUploadSectionProps) => {

  const resumeUploaded = useAtomValue(resumeUploadedAtom);
  const processingResume = useAtomValue(processingResumeAtom)
  const fileName = useAtomValue(fileNameAtom)

  return (
    <Card className={`mb-8 ${processingResume ? "pointer-events-none opacity-50" : ""}`}>
      <CardHeader>
        <CardTitle>Find Your Perfect Match</CardTitle>
        <CardDescription>
          Upload your resume to see which positions best match your skills and experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!resumeUploaded ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 w-full text-center">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
               Click to browse Resume
              </p>
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.docx"
                className="hidden"
                onChange={onFileUpload}
                disabled={processingResume}
              />
              <Button
                onClick={() => document.getElementById('resume-upload')?.click()}
                variant="outline"
                disabled={processingResume}
              >
                Select File
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Accepted formats: PDF, DOCX (Max size: 5MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-full p-4 border rounded-lg">
              <div className="flex w-full justify-between items-center">
                <p className="font-medium">
                  <span>{fileName}</span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetUpload}
                  disabled={processingResume}
                >
                  Upload Different Resume
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};