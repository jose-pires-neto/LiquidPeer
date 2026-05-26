import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileArchive,
  FileCode,
  File as FileIcon,
} from 'lucide-react';

type LucideIconType = typeof FileIcon;

export interface FileIconConfig {
  icon: LucideIconType;
  color: string;
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
const VIDEO_EXTS = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'];
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
const ARCHIVE_EXTS = ['zip', 'rar', '7z', 'tar', 'gz'];
const CODE_EXTS = ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'py', 'java', 'cpp', 'c', 'sh'];
const DOC_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'];

export const getFileIcon = (filename: string): FileIconConfig => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (IMAGE_EXTS.includes(ext)) return { icon: ImageIcon, color: 'text-sky-300' };
  if (VIDEO_EXTS.includes(ext)) return { icon: Video, color: 'text-sky-300' };
  if (AUDIO_EXTS.includes(ext)) return { icon: Music, color: 'text-sky-300' };
  if (ARCHIVE_EXTS.includes(ext)) return { icon: FileArchive, color: 'text-sky-300' };
  if (CODE_EXTS.includes(ext)) return { icon: FileCode, color: 'text-sky-300' };
  if (DOC_EXTS.includes(ext)) return { icon: FileText, color: 'text-sky-300' };

  return { icon: FileIcon, color: 'text-slate-400' };
};
