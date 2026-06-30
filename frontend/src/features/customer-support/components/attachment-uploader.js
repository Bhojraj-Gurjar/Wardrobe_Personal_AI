'use client';

import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB } from '../utils/support.constants';
import { FileUpload } from '@/components/ui/file-upload';

export function AttachmentUploader({ files, onChange, className }) {
  return (
    <FileUpload
      className={className}
      files={files}
      onChange={onChange}
      accept={ALLOWED_FILE_TYPES}
      maxSizeMb={MAX_FILE_SIZE_MB}
      supportedTypesLabel="PNG, JPG, WEBP, PDF, TXT"
    />
  );
}
