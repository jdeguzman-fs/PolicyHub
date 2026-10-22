import DOMPurify from 'dompurify';

const NOTES_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'title'],
};

export function sanitizeHtml(dirty) {
  if (dirty == null) return '';
  return DOMPurify.sanitize(String(dirty), NOTES_CONFIG);
}
