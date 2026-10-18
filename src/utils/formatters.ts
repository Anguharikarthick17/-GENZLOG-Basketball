import type { FileTypeCategory } from '../types/uploader';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileCategory(file: File): FileTypeCategory {
  const mime = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (mime.includes('pdf') || ext === 'pdf') return 'PDF';
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext)) {
    return 'IMG';
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('text') ||
    ['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)
  ) {
    return 'DOC';
  }
  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'ZIP';
  }
  if (
    ['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'html', 'css', 'go', 'rs', 'java', 'cpp'].includes(ext)
  ) {
    return 'CODE';
  }

  return 'FILE';
}
