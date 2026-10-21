import api from './api';

// SVG is intentionally excluded: SVG can embed scripts that would execute when
// the blob is rendered in a new tab (stored XSS). Only non-executable raster
// formats and PDF are previewed inline; everything else downloads.
const INLINE_TYPES = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'pdf']);

function extOf(name) {
  const i = (name || '').lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

export async function openAttachment(url, fileName) {
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], {
    type: res.headers['content-type'] ?? 'application/octet-stream',
  });
  const objectUrl = URL.createObjectURL(blob);
  const inline = INLINE_TYPES.has(extOf(fileName));
  const a = document.createElement('a');
  a.href = objectUrl;
  if (inline) {
    window.open(objectUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    return true;
  }
  a.download = fileName || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  return true;
}
