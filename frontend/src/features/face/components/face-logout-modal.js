'use client';



import { useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';

import { FaceVerificationCamera } from '@/features/face/components/face-verification-camera';

import { useLogoutMutation } from '@/features/auth/hooks/use-logout-mutation';

import { Button } from '@/components/ui/button';

import { cn } from '@/utils/cn';



const STEP = {

  VERIFY: 'verify',

  FALLBACK: 'fallback',

};



export function FaceLogoutModal({ open, onClose, onNavigate }) {

  const logoutMutation = useLogoutMutation();

  const [step, setStep] = useState(STEP.VERIFY);

  const isLoading = logoutMutation.isPending;



  useEffect(() => {

    if (open) {

      setStep(STEP.VERIFY);

    }

  }, [open]);



  if (!open) {

    return null;

  }



  const handleLogout = (options = {}) => {

    onNavigate?.();

    logoutMutation.mutate(options, {

      onSettled: () => onClose(),

    });

  };



  const handleVerified = (result) => {

    handleLogout({ logoutNonce: result?.logoutNonce });

  };



  const handleSkipFaceLogout = () => {

    handleLogout();

  };



  const handleCameraDenied = () => {

    setStep(STEP.FALLBACK);

  };



  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4 backdrop-blur-sm"

      role="dialog"

      aria-modal="true"

      aria-labelledby="face-logout-modal-title"

    >

      <div

        className={cn(

          'w-full max-w-md space-y-5 rounded-2xl border border-dashboard-border',

          'bg-dashboard-surface p-6 shadow-xl',

        )}

      >

        {step === STEP.VERIFY ? (

          <>

            <div className="space-y-2">

              <h2

                id="face-logout-modal-title"

                className="text-lg font-semibold text-dashboard-foreground"

              >

                Verify your identity

              </h2>

              <p className="text-sm text-dashboard-muted">

                Only your registered face can end this session. Look at the camera

                and we&apos;ll verify you before logging out.

              </p>

            </div>



            <FaceVerificationCamera

              purpose="logout"

              onVerified={handleVerified}

              onCameraDenied={handleCameraDenied}

            />



            <div className="space-y-2">

              <Button

                type="button"

                variant="ghost"

                disabled={isLoading}

                onClick={onClose}

                className="w-full text-dashboard-muted hover:text-dashboard-foreground"

              >

                Cancel

              </Button>

              <Button

                type="button"

                variant="outline"

                disabled={isLoading}

                onClick={handleSkipFaceLogout}

                className={cn(

                  'w-full rounded-xl border-dashboard-border',

                  'bg-dashboard-surface-elevated text-dashboard-foreground',

                  'hover:bg-dashboard-surface',

                )}

              >

                {isLoading ? (

                  <>

                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />

                    Logging out…

                  </>

                ) : (

                  'Skip face verification'

                )}

              </Button>

            </div>

          </>

        ) : null}



        {step === STEP.FALLBACK ? (

          <>

            <div className="space-y-2">

              <h2

                id="face-logout-modal-title"

                className="text-lg font-semibold text-dashboard-foreground"

              >

                Camera access required

              </h2>

              <p className="text-sm text-dashboard-muted">

                Enable camera access to verify your face, or skip verification to

                log out with your current session.

              </p>

            </div>



            <div className="flex flex-col gap-3">

              <Button

                type="button"

                disabled={isLoading}

                onClick={() => setStep(STEP.VERIFY)}

                className="w-full rounded-xl"

              >

                Try Again

              </Button>

              <Button

                type="button"

                variant="outline"

                disabled={isLoading}

                onClick={handleSkipFaceLogout}

                className={cn(

                  'w-full rounded-xl border-dashboard-border',

                  'bg-dashboard-surface-elevated text-dashboard-foreground',

                  'hover:bg-dashboard-surface',

                )}

              >

                {isLoading ? (

                  <>

                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />

                    Logging out…

                  </>

                ) : (

                  'Skip face verification'

                )}

              </Button>

              <Button

                type="button"

                variant="ghost"

                disabled={isLoading}

                onClick={onClose}

                className="w-full text-dashboard-muted hover:text-dashboard-foreground"

              >

                Cancel

              </Button>

            </div>

          </>

        ) : null}

      </div>

    </div>

  );

}

