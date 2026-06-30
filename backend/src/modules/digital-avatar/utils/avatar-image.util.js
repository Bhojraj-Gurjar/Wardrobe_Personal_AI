export function sanitizeAiResponseForDatabase(aiResponse, storagePath) {
  if (!aiResponse || typeof aiResponse !== 'object') {
    return {
      avatarImagePath: storagePath,
    };
  }

  const sanitized = { ...aiResponse };
  delete sanitized.avatarImage;
  delete sanitized.avatar_image;
  delete sanitized.avatarImageUrl;

  return {
    ...sanitized,
    avatarImagePath: storagePath,
  };
}
