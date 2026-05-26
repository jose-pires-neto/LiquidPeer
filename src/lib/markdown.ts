const CODE_PATTERNS = [
  /^\s*import\s+.*\s+from\s+['"].*['"]/,
  /^\s*import\s+\{.*\}\s+from\s+['"].*['"]/,
  /^\s*const\s+\w+\s*=/,
  /^\s*let\s+\w+\s*=/,
  /^\s*var\s+\w+\s*=/,
  /^\s*function\s+\w+\s*\(/,
  /^\s*class\s+\w+/,
  /^\s*public\s+class\s+\w+/,
  /^\s*def\s+\w+\(.*\):/,
  /^\s*if\s*\(.*\)\s*\{/,
  /^\s*for\s*\(.*\)\s*\{/,
  /^\s*html\s*,\s*body\s*\{/,
  /^\s*package\s+\w+/,
  /^\s*using\s+\w+/,
  /^\s*#include\s+<.*>/,
];

const detectLanguage = (lines: string[]): string => {
  if (lines.some(line => /import\s+.*from|const\s+.*=/.test(line))) return 'typescript';
  if (lines.some(line => /def\s+\w+\(/.test(line))) return 'python';
  if (lines.some(line => /#include/.test(line))) return 'cpp';
  if (lines.some(line => /html|body|div|\.[\w-]+\s*\{/.test(line))) return 'css';
  return '';
};

export const detectAndWrapCode = (text: string): string => {
  const trimmed = text.trim();

  if (trimmed.startsWith('```') && trimmed.endsWith('```')) return text;

  const lines = trimmed.split('\n');
  if (lines.length < 2) return text;

  const hasKeywords = lines.some(line => CODE_PATTERNS.some(regex => regex.test(line)));
  const structuralChars = lines.filter(line =>
    line.includes(';') || line.includes('{') || line.includes('}')
  ).length;
  const hasStructure = structuralChars >= lines.length * 0.25;

  if (!hasKeywords && !hasStructure) return text;

  const lang = detectLanguage(lines);
  return `\`\`\`${lang}\n${text}\n\`\`\``;
};
