import React, { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content, isStreaming }) => {
  const [animateBlur, setAnimateBlur] = useState(Boolean(isStreaming));

  useEffect(() => {
    if (isStreaming) {
      setAnimateBlur(true);
      return;
    }
    if (animateBlur) {
      const timer = setTimeout(() => setAnimateBlur(false), 450);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, animateBlur]);

  return (
    <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-[15px] leading-relaxed space-y-3">
      {parseMarkdown(content, animateBlur)}
      {isStreaming && (
        <span
          className="inline-block w-1.5 h-4 ml-1 bg-cyan-500 dark:bg-cyan-400 animate-pulse align-middle rounded-xs"
          aria-label="Generating..."
        />
      )}
    </div>
  );
});

function parseMarkdown(text: string, animateBlur: boolean): React.ReactNode[] {
  if (!text) return [];

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  const blockAnim = animateBlur ? 'animate-block-blur' : '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block detection
    if (line.trim().startsWith('```')) {
      const startLine = i;
      const langMatch = line.trim().match(/^```([a-zA-Z0-9_-]*)/);
      const language = langMatch ? langMatch[1] : '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const codeContent = codeLines.join('\n');
      elements.push(
        <div key={`code-${startLine}`} className={blockAnim || undefined}>
          <CodeBlock language={language} code={codeContent} />
        </div>
      );
      continue;
    }

    // Block Math detection: line starts with $$
    if (line.trim().startsWith('$$')) {
      const startLine = i;
      const mathLines: string[] = [];
      if (line.trim() === '$$') {
        i++;
        while (i < lines.length && lines[i].trim() !== '$$') {
          mathLines.push(lines[i]);
          i++;
        }
        i++; // skip closing $$
      } else {
        const single = line.trim().replace(/^\$\$\s*/, '').replace(/\s*\$\$$/, '');
        mathLines.push(single);
        i++;
      }
      elements.push(
        <div
          key={`mathblock-${startLine}`}
          className={`my-3 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-cyan-500/20 text-center overflow-x-auto shadow-xs ${blockAnim}`}
        >
          <div className="font-mono text-[15px] font-semibold text-cyan-700 dark:text-cyan-300 tracking-wide inline-block">
            {cleanMathNotation(mathLines.join('\n'))}
          </div>
        </div>
      );
      continue;
    }

    // Markdown Table detection: line with | and next line with |---
    if (
      line.trim().startsWith('|') &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith('|') &&
      lines[i + 1].includes('-')
    ) {
      const startLine = i;
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={`table-${startLine}`} className={blockAnim || undefined}>
          <TableBlock tableLines={tableLines} />
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className={`text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-6 mb-2 ${blockAnim}`}>
          {formatInline(line.slice(2), animateBlur)}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className={`text-xl font-semibold text-slate-900 dark:text-white tracking-tight mt-5 mb-2 ${blockAnim}`}>
          {formatInline(line.slice(3), animateBlur)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className={`text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight mt-4 mb-1.5 ${blockAnim}`}>
          {formatInline(line.slice(4), animateBlur)}
        </h3>
      );
      i++;
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      const startLine = i;
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${startLine}`}
          className={`border-l-2 border-cyan-500/50 pl-4 py-1 my-2 text-slate-600 dark:text-slate-400 italic bg-slate-100/70 dark:bg-slate-900/40 rounded-r-md ${blockAnim}`}
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx}>{formatInline(ql, animateBlur)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={`hr-${i}`} className={`my-6 border-slate-200 dark:border-slate-800 ${blockAnim}`} />);
      i++;
      continue;
    }

    // Lists (Unordered)
    if (/^(\s*)[-*+]\s+/.test(line)) {
      const startLine = i;
      const listItems: string[] = [];
      while (i < lines.length && /^(\s*)[-*+]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^(\s*)[-*+]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${startLine}`} className="list-disc list-inside space-y-1.5 my-2 text-slate-800 dark:text-slate-200">
          {listItems.map((item, idx) => (
            <li key={idx} className={`leading-relaxed ${blockAnim}`}>
              {formatInline(item, animateBlur)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Lists (Ordered)
    if (/^\s*\d+\.\s+/.test(line)) {
      const startLine = i;
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${startLine}`} className="list-decimal list-inside space-y-1.5 my-2 text-slate-800 dark:text-slate-200">
          {listItems.map((item, idx) => (
            <li key={idx} className={`leading-relaxed ${blockAnim}`}>
              {formatInline(item, animateBlur)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular Paragraph
    elements.push(
      <p key={`p-${i}`} className={`leading-relaxed ${blockAnim}`}>
        {formatInline(line, animateBlur)}
      </p>
    );
    i++;
  }

  return elements;
}

// Inline formatting: code, bold, italic, links, math ($...$)
function formatInline(text: string, animateBlur = false): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  let wordKey = 0;
  const inlineAnim = animateBlur ? 'animate-text-blur' : '';

  const pushPlainText = (rawSegment: string) => {
    const cleaned = cleanTextChunk(rawSegment);
    if (!animateBlur) {
      parts.push(cleaned);
      return;
    }
    const tokens = cleaned.split(/(\s+)/);
    for (const token of tokens) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        parts.push(token);
      } else {
        parts.push(
          <span key={`w-${wordKey++}`} className="animate-text-blur">
            {token}
          </span>
        );
      }
    }
  };

  while (remaining) {
    // Inline code `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Bold **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Italic *text*
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    // Link [label](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    // Inline math $formula$ (handles $a^2 = b$ or $\sqrt{b} = a$)
    const mathMatch = remaining.match(/\$([^\$\n]+)\$/);

    // Find earliest match
    const matches = [
      codeMatch ? { type: 'code', index: codeMatch.index!, length: codeMatch[0].length, val: codeMatch[1] } : null,
      boldMatch ? { type: 'bold', index: boldMatch.index!, length: boldMatch[0].length, val: boldMatch[1] } : null,
      italicMatch ? { type: 'italic', index: italicMatch.index!, length: italicMatch[0].length, val: italicMatch[1] } : null,
      linkMatch ? { type: 'link', index: linkMatch.index!, length: linkMatch[0].length, label: linkMatch[1], url: linkMatch[2] } : null,
      mathMatch ? { type: 'math', index: mathMatch.index!, length: mathMatch[0].length, val: mathMatch[1] } : null,
    ].filter(Boolean) as Array<{
      type: string;
      index: number;
      length: number;
      val?: string;
      label?: string;
      url?: string;
    }>;

    if (matches.length === 0) {
      pushPlainText(remaining);
      break;
    }

    matches.sort((a, b) => a.index - b.index);
    const first = matches[0];

    // Push text before match
    if (first.index > 0) {
      pushPlainText(remaining.slice(0, first.index));
    }

    // Format match
    if (first.type === 'code') {
      parts.push(
        <code
          key={`inline-code-${key++}`}
          className={`px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-cyan-700 dark:text-cyan-300 font-mono text-[13px] border border-slate-200 dark:border-white/[0.06] ${inlineAnim}`}
        >
          {first.val}
        </code>
      );
    } else if (first.type === 'bold') {
      parts.push(
        <strong key={`bold-${key++}`} className={`font-semibold text-slate-900 dark:text-white ${inlineAnim}`}>
          {first.val}
        </strong>
      );
    } else if (first.type === 'italic') {
      parts.push(
        <em key={`italic-${key++}`} className={`italic text-slate-600 dark:text-slate-300 ${inlineAnim}`}>
          {first.val}
        </em>
      );
    } else if (first.type === 'link') {
      parts.push(
        <a
          key={`link-${key++}`}
          href={first.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 underline decoration-cyan-500/40 underline-offset-2 transition-colors ${inlineAnim}`}
        >
          {first.label}
        </a>
      );
    } else if (first.type === 'math') {
      parts.push(
        <span
          key={`inline-math-${key++}`}
          className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/40 text-cyan-800 dark:text-cyan-200 font-mono text-[13.5px] font-medium tracking-wide ${inlineAnim}`}
        >
          {cleanMathNotation(first.val!)}
        </span>
      );
    }

    remaining = remaining.slice(first.index + first.length);
  }

  return parts;
}

// Code Block Component with Copy Action
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-800 bg-[#0d121c] shadow-md">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs font-mono text-slate-400">
        <span className="text-slate-300 font-medium">
          {language ? language.toLowerCase() : 'plaintext'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px] font-sans">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-sans">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-[13.5px] leading-relaxed font-mono text-slate-200">
        <pre className="m-0 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// Table Block Component
const TableBlock: React.FC<{ tableLines: string[] }> = ({ tableLines }) => {
  if (tableLines.length < 2) return null;

  const headerLine = tableLines[0];
  const bodyLines = tableLines.slice(2);

  const parseRow = (line: string) =>
    line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

  const headers = parseRow(headerLine);

  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
      <table className="w-full text-left text-[14px] text-slate-800 dark:text-slate-200">
        <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold">
                {formatInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
          {bodyLines.map((line, rIdx) => {
            const cells = parseRow(line);
            return (
              <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                {cells.map((c, cIdx) => (
                  <td key={cIdx} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                    {formatInline(c)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Transforms raw LaTeX and mathematical notation into clean, beautiful, human-readable math.
 * E.g.: a^2 = b -> a² = b, \sqrt{b} = a -> √b = a, \frac{a}{b} -> (a / b)
 */
export function cleanMathNotation(raw: string): string {
  if (!raw) return '';
  let str = raw;

  // Fractions: \frac{a}{b} -> (a / b)
  str = str.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');

  // Square roots: \sqrt{a} -> √a, \sqrt[n]{a} -> ⁿ√a
  str = str.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '$1√($2)');
  str = str.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  str = str.replace(/\\sqrt\s*([a-zA-Z0-9]+)/g, '√$1');

  // Text inside math: \text{...} -> ...
  str = str.replace(/\\text\{([^}]+)\}/g, '$1');
  str = str.replace(/\\mathrm\{([^}]+)\}/g, '$1');
  str = str.replace(/\\mathbf\{([^}]+)\}/g, '$1');

  // Common math symbols
  str = str.replace(/\\times/g, ' × ');
  str = str.replace(/\\cdot/g, ' · ');
  str = str.replace(/\\div/g, ' ÷ ');
  str = str.replace(/\\pm/g, '±');
  str = str.replace(/\\mp/g, '∓');
  str = str.replace(/\\neq/g, '≠');
  str = str.replace(/\\ne\b/g, '≠');
  str = str.replace(/\\leq/g, '≤');
  str = str.replace(/\\le\b/g, '≤');
  str = str.replace(/\\geq/g, '≥');
  str = str.replace(/\\ge\b/g, '≥');
  str = str.replace(/\\approx/g, '≈');
  str = str.replace(/\\sim/g, '~');
  str = str.replace(/\\infty/g, '∞');
  str = str.replace(/\\rightarrow/g, '→');
  str = str.replace(/\\Rightarrow/g, '⇒');
  str = str.replace(/\\leftarrow/g, '←');
  str = str.replace(/\\Leftarrow/g, '⇐');
  str = str.replace(/\\leftrightarrow/g, '↔');

  // Greek letters
  str = str.replace(/\\pi/g, 'π');
  str = str.replace(/\\alpha/g, 'α');
  str = str.replace(/\\beta/g, 'β');
  str = str.replace(/\\gamma/g, 'γ');
  str = str.replace(/\\Delta/g, 'Δ');
  str = str.replace(/\\delta/g, 'δ');
  str = str.replace(/\\theta/g, 'θ');
  str = str.replace(/\\lambda/g, 'λ');
  str = str.replace(/\\mu/g, 'μ');
  str = str.replace(/\\sigma/g, 'σ');
  str = str.replace(/\\omega/g, 'ω');
  str = str.replace(/\\Omega/g, 'Ω');
  str = str.replace(/\\sum/g, '∑');
  str = str.replace(/\\prod/g, '∏');
  str = str.replace(/\\int/g, '∫');

  // Superscripts (e.g. ^2 -> ², ^3 -> ³, ^n -> ⁿ, ^{10} -> ¹⁰)
  str = str.replace(/\^{([0-9a-zA-Z+-]+)\}/g, (_, exp) => toSuperscript(exp));
  str = str.replace(/\^([0-9a-zA-Z+-])/g, (_, exp) => toSuperscript(exp));

  // Subscripts (e.g. _0 -> ₀, _{1} -> ₁)
  str = str.replace(/_\{([0-9a-zA-Z+-]+)\}/g, (_, sub) => toSubscript(sub));
  str = str.replace(/_([0-9a-zA-Z+-])/g, (_, sub) => toSubscript(sub));

  // Clean trailing or stray backslashes
  str = str.replace(/\\([a-zA-Z]+)/g, '$1');
  str = str.replace(/\\/g, '');

  return str;
}

function cleanTextChunk(text: string): string {
  // If text contains unescaped LaTeX commands outside delimiters (e.g. \sqrt{b} or a^2), clean them
  if (text.includes('\\sqrt') || text.includes('\\frac') || text.includes('\\pm') || text.includes('\\times')) {
    return cleanMathNotation(text);
  }
  return text;
}

function toSuperscript(val: string): string {
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'a': 'ᵃ', 'b': 'ᵇ',
  };
  return val.split('').map((char) => map[char] || char).join('');
}

function toSubscript(val: string): string {
  const map: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'n': 'ₙ', 'i': 'ᵢ',
  };
  return val.split('').map((char) => map[char] || char).join('');
}
