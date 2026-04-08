export function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const base = "https://img.icons8.com/color/48/000000";
  if (['pdf'].includes(ext)) return `${base}/pdf.png`;
  if (['doc', 'docx'].includes(ext)) return `${base}/word.png`;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return `${base}/ms-excel.png`;
  if (['ppt', 'pptx'].includes(ext)) return `${base}/powerpoint.png`;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return `${base}/archive.png`;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return `${base}/image.png`;
  if (['mp4', 'avi', 'mkv', 'mov', 'flv'].includes(ext)) return `${base}/video.png`;
  if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) return `${base}/audio-file.png`;
  if (['py', 'js', 'ts', 'html', 'css', 'json', 'md', 'cpp', 'c', 'java'].includes(ext)) return `${base}/code.png`;
  if (['txt'].includes(ext)) return `${base}/txt.png`;
  return `${base}/document.png`;
}
