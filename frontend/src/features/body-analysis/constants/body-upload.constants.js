export const BODY_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const BODY_UPLOAD_MIN_WIDTH = 320;
export const BODY_UPLOAD_MIN_HEIGHT = 480;
export const BODY_UPLOAD_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';

export const FULL_BODY_VALIDATION_ERROR =
  'Full body not detected. Please upload a clear full-body photo with your entire body, including both feet, visible.';

export const BODY_ANALYSIS_PROGRESS_STEPS = [
  { id: 'validating', label: 'Validating Full Body…' },
  { id: 'uploading', label: 'Uploading Photo…' },
  { id: 'detecting', label: 'Detecting Human Body…' },
  { id: 'analyzing', label: 'Analyzing Body Profile…' },
  { id: 'extracting', label: 'Extracting Body Measurements…' },
  { id: 'generating', label: 'Generating Personalized Profile…' },
  { id: 'updating', label: 'Updating Recommendations…' },
];
