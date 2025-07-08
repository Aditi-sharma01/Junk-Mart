import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Google Drive shareable link to a direct image link for embedding.
 * Supports links like:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * Returns:
 *   https://drive.google.com/uc?export=view&id=FILE_ID
 */
export function getGoogleDriveImageSrc(shareableUrl: string): string {
  const match = shareableUrl.match(/\/d\/([^/]+)\//);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return shareableUrl; // fallback to original if not a Drive link
}
