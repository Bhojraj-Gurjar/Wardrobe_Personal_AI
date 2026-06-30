'use client';

import { UploadDropzone } from './upload-dropzone';
import { WebcamButton } from './webcam-button';
import { VTO_CARD_CLASS } from '../../styles/virtual-try-on-tokens';

export function UploadPanel({
  bodyPhotoUrl,
  previewKey,
  usingTemporaryPhoto,
  isUploading,
  uploadError,
  onUpload,
  onRemove,
  onUseOnboardingPhoto,
}) {
  return (
    <section className={`${VTO_CARD_CLASS} overflow-hidden`}>
      <div className="border-b border-white/[0.08] px-5 py-4">
        <h2 className="text-base font-semibold text-white">Upload Your Photo</h2>
        <p className="mt-1 text-sm text-white/50">
          Full-body photo works best. JPG, PNG up to 10MB
        </p>
      </div>

      <div className="p-5">
        <UploadDropzone
          bodyPhotoUrl={bodyPhotoUrl}
          previewKey={previewKey}
          usingTemporaryPhoto={usingTemporaryPhoto}
          isUploading={isUploading}
          uploadError={uploadError}
          onUpload={onUpload}
          onRemove={() => {
            onUseOnboardingPhoto();
          }}
        />

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Or use your webcam
          </span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <WebcamButton onCapture={onUpload} disabled={isUploading} />
      </div>
    </section>
  );
}
