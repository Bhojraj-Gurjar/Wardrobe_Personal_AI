const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);
const MAX_BYTES = 10 * 1024 * 1024;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 320;

function resolveExtension(fileName = '') {
  const match = String(fileName).toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || '';
}

export function validateFaceImageFile(file) {
  if (!file) {
    return { ok: false, error: 'No image selected.' };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Image is too large. Maximum size is 10 MB.' };
  }

  const mime = String(file.type || '').toLowerCase();
  const extension = resolveExtension(file.name);

  if (!ALLOWED_MIME_TYPES.has(mime) && !ALLOWED_EXTENSIONS.has(extension)) {
    return { ok: false, error: 'Unsupported format. Upload a JPG, JPEG, or PNG image.' };
  }

  return { ok: true };
}

export function loadFaceImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image. The file may be corrupted.'));
    };

    image.src = url;
  });
}

export async function validateFaceImageFileWithDimensions(file) {
  const base = validateFaceImageFile(file);

  if (!base.ok) {
    return base;
  }

  try {
    const { width, height } = await loadFaceImageDimensions(file);

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      return {
        ok: false,
        error: `Image resolution is too low. Minimum size is ${MIN_WIDTH}×${MIN_HEIGHT}px.`,
      };
    }

    return { ok: true, width, height };
  } catch (error) {
    return {
      ok: false,
      error: error?.message || 'Could not read image. The file may be corrupted.',
    };
  }
}
