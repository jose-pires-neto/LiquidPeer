export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatSpeed = (bytesPerSec?: number): string => {
  if (bytesPerSec === undefined || bytesPerSec === null || bytesPerSec === 0) return '0 KB/s';
  return formatBytes(bytesPerSec) + '/s';
};

export const formatEta = (seconds?: number): string => {
  if (seconds === undefined || seconds === null || seconds === Infinity || isNaN(seconds)) return '';
  if (seconds <= 0) return '';
  if (seconds < 60) return `~ ${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `~ ${mins}m ${secs}s`;
};
