const FLAGGED_KEYWORDS = ['fake', 'fraud', 'scam'] as const;

export function isReviewFlagged(rating: number, comment: string | null | undefined) {
  if (rating === 1) return true;
  if (!comment) return false;
  const normalized = comment.toLowerCase();
  return FLAGGED_KEYWORDS.some((word) => normalized.includes(word));
}

export { FLAGGED_KEYWORDS };
