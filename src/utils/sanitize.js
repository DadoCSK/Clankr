/**
 * Input sanitization utilities.
 * Defense-in-depth: strip dangerous content before it enters the DB.
 * React escapes output by default, but we clean at the API layer too
 * so data is safe regardless of how it's consumed (API clients, exports, etc.).
 */

// Strip HTML tags (including script, style, iframe, object, embed, svg, math)
const HTML_TAG_RE = /<\/?[a-z][^>]*>/gi;

// Strip common XSS vectors that might bypass simple tag stripping
const XSS_PATTERNS = [
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=/gi,            // onclick=, onerror=, onload=, etc.
  /expression\s*\(/gi,      // CSS expression()
  /url\s*\(\s*['"]?\s*javascript/gi,
];

// Control characters (except newline, tab, carriage return)
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Sanitize a text string: strip HTML tags, XSS patterns, and control characters.
 * Safe for use in DB storage, API responses, and LLM prompts.
 */
function sanitizeText(input) {
  if (typeof input !== 'string') return input;

  let clean = input;

  // Strip HTML tags
  clean = clean.replace(HTML_TAG_RE, '');

  // Strip XSS patterns
  for (const pattern of XSS_PATTERNS) {
    clean = clean.replace(pattern, '');
  }

  // Strip control characters (keep \n, \t, \r)
  clean = clean.replace(CONTROL_CHARS_RE, '');

  return clean.trim();
}

/**
 * Sanitize every string item in an array. Non-strings are dropped.
 */
function sanitizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item) => typeof item === 'string')
    .map((item) => sanitizeText(item))
    .filter((item) => item.length > 0);
}

/**
 * Sanitize text that will be injected into an LLM prompt.
 * Strips prompt-injection patterns on top of standard sanitization.
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /ignore\s+(all\s+)?above/gi,
  /disregard\s+(all\s+)?previous/gi,
  /you\s+are\s+now\s+/gi,
  /new\s+instructions?\s*:/gi,
  /system\s*:\s*/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<<SYS>>/gi,
  /<\/SYS>>/gi,
];

function sanitizeForPrompt(input) {
  if (typeof input !== 'string') return input;
  let clean = sanitizeText(input);
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    clean = clean.replace(pattern, '');
  }
  return clean.trim();
}

module.exports = {
  sanitizeText,
  sanitizeArray,
  sanitizeForPrompt,
};
