import { BadRequestException } from '@nestjs/common';

const SUPPORTED_IMAGE_PATTERN = /\.(jpg|jpeg|png|webp)(\?|$)/i;
const MAX_IMAGE_URL_LENGTH = 2048;

export function assertTryOnImageUrl(value, label) {
  if (!value || typeof value !== 'string') {
    throw new BadRequestException(`${label} image missing.`);
  }

  const trimmed = value.trim();

  if (trimmed.length > MAX_IMAGE_URL_LENGTH) {
    throw new BadRequestException(`${label} image URL is too long.`);
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    throw new BadRequestException(`${label} image must be a public HTTP(S) URL.`);
  }

  if (!SUPPORTED_IMAGE_PATTERN.test(trimmed) && !trimmed.includes('/uploads/')) {
    throw new BadRequestException(`Unsupported ${label.toLowerCase()} image format.`);
  }

  return trimmed;
}

export function mapTryOnServiceError(error) {
  const status = error?.response?.status;
  const detail = String(
    error?.response?.data?.detail
    || error?.response?.data?.message
    || error?.message
    || '',
  ).trim();
  const normalized = detail.toLowerCase();

  if (error?.code === 'ECONNABORTED' || status === 504) {
    return 'Virtual Try-On generation timed out.';
  }

  if (status === 503 || normalized.includes('model loading') || normalized.includes('loading')) {
    return 'Model loading. Please retry in a few seconds.';
  }

  if (normalized.includes('rate limit') || normalized.includes('quota')) {
    return 'HuggingFace rate limit exceeded. Please try again later.';
  }

  if (normalized.includes('hf_token') || normalized.includes('hugging face token')) {
    return 'HuggingFace token missing.';
  }

  if (normalized.includes('download') && normalized.includes('person')) {
    return 'Person image missing or unreachable.';
  }

  if (normalized.includes('download') && normalized.includes('garment')) {
    return 'Invalid garment image.';
  }

  if (normalized.includes('download')) {
    return 'Unable to download input image for try-on.';
  }

  if (!status && (normalized.includes('econnrefused') || normalized.includes('connect'))) {
    return 'Unable to contact HuggingFace try-on service.';
  }

  if (normalized.includes('permission denied') || normalized.includes('storage upload failed')) {
    return 'Storage upload failed.';
  }

  if (normalized.includes('econnrefused') || normalized.includes('unable to reach')) {
    return 'Unable to reach AI service.';
  }

  if (normalized.includes('authentication') || normalized.includes('unauthorized')) {
    return 'Authentication failed.';
  }

  if (detail) {
    return detail;
  }

  if (status) {
    return `Virtual try-on failed (HTTP ${status}).`;
  }

  return 'Virtual try-on generation failed.';
}

export function isRetryableTryOnError(error) {
  const status = error?.response?.status;
  const detail = String(
    error?.response?.data?.detail
    || error?.response?.data?.message
    || error?.message
    || '',
  ).toLowerCase();

  return (
    status === 503
    || detail.includes('model loading')
    || detail.includes('loading')
    || detail.includes('is currently loading')
  );
}
