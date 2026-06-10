'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AvailabilityConfirmationPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const candidate = searchParams.get('candidate');
  const round = searchParams.get('round');

  const isAvailable = status === 'available';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {isAvailable ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-center text-2xl">Availability {isAvailable ? 'Confirmed' : 'Declined'}</CardTitle>
          <CardDescription className="text-center">
            {isAvailable 
              ? 'Thank you for confirming your availability.'
              : 'Thank you for letting us know you are not available.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-2">
            <span className="font-medium">Candidate:</span> {candidate || 'Not specified'}
          </p>
          <p>
            <span className="font-medium">Interview Round:</span> {round || 'Not specified'}
          </p>
          
          <div className="mt-6">
            {isAvailable ? (
              <p className="text-sm text-gray-600">
                The interview has been added to your schedule. You will receive a calendar invitation shortly with all the details.
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                We will work to find an alternative time or panel member. You may be contacted again if needed.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}