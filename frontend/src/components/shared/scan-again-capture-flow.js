'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageSourceModal } from '@/components/shared/image-source-modal';
import { SimplePhotoCaptureDialog } from '@/features/face/components/simple-photo-capture-dialog';
import { validateFaceImageFileWithDimensions } from '@/features/face/utils/validate-face-image.util';

export function ScanAgainCaptureFlow({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = '',
  sourceTitle,
  sourceSubtitle,
  captureTitle,
  captureDescription,
  captureSubmitLabel,
  accept = 'image/*',
}) {
  const fileInputRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const reopenSourceOnCancelRef = useRef(false);

  const resetFlow = useCallback(() => {
    setCameraOpen(false);
    setUploadBusy(false);
    setLocalError('');
    reopenSourceOnCancelRef.current = false;
  }, []);

  useEffect(() => {
    if (!open) {
      resetFlow();
    }
  }, [open, resetFlow]);

  const handleCloseAll = useCallback(() => {
    resetFlow();
    onClose?.();
  }, [onClose, resetFlow]);

  const handleTakePhoto = useCallback(() => {
    setCameraOpen(true);
  }, []);

  const handleUploadClick = useCallback(() => {
    setUploadBusy(true);
    reopenSourceOnCancelRef.current = true;
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setUploadBusy(false);

    if (!file) {
      if (reopenSourceOnCancelRef.current) {
        reopenSourceOnCancelRef.current = false;
      }
      return;
    }

    reopenSourceOnCancelRef.current = false;

    const validation = await validateFaceImageFileWithDimensions(file);
    if (!validation.ok) {
      setLocalError(validation.error);
      return;
    }

    try {
      setLocalError('');
      await onSubmit?.(file, { source: 'upload' });
      handleCloseAll();
    } catch {
      // Parent surfaces errorMessage
    }
  }, [handleCloseAll, onSubmit]);

  const handleCameraSubmit = useCallback(async (file, meta = {}) => {
    setLocalError('');
    await onSubmit?.(file, meta);
    handleCloseAll();
  }, [handleCloseAll, onSubmit]);

  const handleCameraClose = useCallback(() => {
    setCameraOpen(false);
  }, []);

  const handleUploadFromCameraError = useCallback(() => {
    setCameraOpen(false);
    setUploadBusy(true);
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      <ImageSourceModal
        open={open && !cameraOpen}
        disabled={isSubmitting || uploadBusy}
        title={sourceTitle}
        subtitle={sourceSubtitle}
        onClose={handleCloseAll}
        onTakePhoto={handleTakePhoto}
        onUpload={handleUploadClick}
      />

      <SimplePhotoCaptureDialog
        open={cameraOpen}
        title={captureTitle}
        description={captureDescription}
        submitLabel={captureSubmitLabel}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage || localError}
        onClose={handleCameraClose}
        onSubmit={handleCameraSubmit}
        onUploadInstead={handleUploadFromCameraError}
      />
    </>
  );
}
