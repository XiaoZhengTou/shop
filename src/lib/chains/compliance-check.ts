// ============================================================
// Compliance Check Utility
// Validates AI-generated content against CN and EN market rules
// ============================================================

export type ComplianceLevel = "error" | "warning" | "pass";

export interface ComplianceIssue {
  level: ComplianceLevel;
  rule: string;
  matched: string;   // The matched word/phrase
  suggestion: string;
}

export interface ComplianceResult {
  passed: boolean;   // true only if no errors (warnings are OK)
  level: ComplianceLevel; // "error" | "warning" | "pass"
  issues: ComplianceIssue[];
  market: "zh" | "en";
}

// ============================================================
// CN 广告法极限词规则
// ============================================================

const CN_ERROR_WORDS = [
  // 绝对化词汇 (Absolute terms - ERROR level)
  "最",
  "第一",
  "唯一",
  "顶级",
  "极致",
  "绝对",
  "史上最",
  "最好",
  "最佳",
  "最优",
  "无与伦比",
  "独一无二",
  "天下第一",
  // 国家级/权威性词汇 (Authority claims - ERROR)
  "国家级",
  "国际级",
  "全国第一",
  "世界第一",
  "全球第一",
  "行业第一",
  // 夸大功效词汇 (Exaggerated effects - ERROR)
  "神效",
  "奇效",
  "立竿见影",
  "一次见效",
  "永久",
  "永远",
];

const CN_WARNING_WORDS = [
  // 需要注意的词汇 (Use with caution - WARNING)
  "首选",
  "领先",
  "顶尖",
  "精选",
  "极品",
  "高端",
  "奢华",
  "超值",
  "震撼",
  "王者",
  "霸主",
  "巅峰",
];

// ============================================================
// EN FTC Guidelines Rules
// ============================================================

const EN_ERROR_PATTERNS: Array<{ pattern: RegExp; rule: string; suggestion: string }> = [
  {
    pattern: /\b(guaranteed|guarantee)\b/i,
    rule: "FTC-1: Unsubstantiated guarantee",
    suggestion: "Remove 'guaranteed' or back with evidence. Use 'designed to' or 'crafted to' instead.",
  },
  {
    pattern: /\b(clinically proven|scientifically proven|medically proven)\b/i,
    rule: "FTC-2: Unsubstantiated clinical claim",
    suggestion: "Remove clinical claim unless backed by peer-reviewed studies. Use 'inspired by' instead.",
  },
  {
    pattern: /\b(#1|number one|number 1)\s+(in|on|for|brand|seller|rated)/i,
    rule: "FTC-3: Unsubstantiated ranking claim",
    suggestion: "Remove ranking claim unless backed by verified data source.",
  },
  {
    pattern: /\b(as seen on tv|celebrity endorsed|doctor recommended)\b/i,
    rule: "FTC-4: Unverified endorsement",
    suggestion: "Remove endorsement claim unless you have written consent and it's current.",
  },
];

const EN_WARNING_PATTERNS: Array<{ pattern: RegExp; rule: string; suggestion: string }> = [
  {
    pattern: /\b(best|greatest|finest|superior)\b/i,
    rule: "FTC-W1: Superlative claim",
    suggestion: "Consider replacing with specific feature description instead of superlative.",
  },
  {
    pattern: /\b(unique|one of a kind|exclusive)\b/i,
    rule: "FTC-W2: Uniqueness claim",
    suggestion: "Ensure this uniqueness claim can be substantiated.",
  },
  {
    pattern: /\b(luxury|premium|high-end)\b/i,
    rule: "FTC-W3: Luxury tier claim",
    suggestion: "Acceptable if product positioning supports it — verify price point alignment.",
  },
];

// ============================================================
// Check Functions
// ============================================================

export function checkZh(text: string): ComplianceResult {
  const issues: ComplianceIssue[] = [];

  // Check error-level words
  for (const word of CN_ERROR_WORDS) {
    if (text.includes(word)) {
      issues.push({
        level: "error",
        rule: "CN-广告法-极限词",
        matched: word,
        suggestion: `删除极限词"${word}"，改用具体描述性语言`,
      });
    }
  }

  // Check warning-level words
  for (const word of CN_WARNING_WORDS) {
    if (text.includes(word)) {
      issues.push({
        level: "warning",
        rule: "CN-广告法-慎用词",
        matched: word,
        suggestion: `慎用"${word}"，确保有实质支撑，或改用更具体的描述`,
      });
    }
  }

  const hasErrors = issues.some((i) => i.level === "error");
  const hasWarnings = issues.some((i) => i.level === "warning");

  return {
    passed: !hasErrors,
    level: hasErrors ? "error" : hasWarnings ? "warning" : "pass",
    issues,
    market: "zh",
  };
}

export function checkEn(text: string): ComplianceResult {
  const issues: ComplianceIssue[] = [];

  // Check error-level patterns
  for (const { pattern, rule, suggestion } of EN_ERROR_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      issues.push({
        level: "error",
        rule,
        matched: match[0],
        suggestion,
      });
    }
  }

  // Check warning-level patterns
  for (const { pattern, rule, suggestion } of EN_WARNING_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      issues.push({
        level: "warning",
        rule,
        matched: match[0],
        suggestion,
      });
    }
  }

  const hasErrors = issues.some((i) => i.level === "error");
  const hasWarnings = issues.some((i) => i.level === "warning");

  return {
    passed: !hasErrors,
    level: hasErrors ? "error" : hasWarnings ? "warning" : "pass",
    issues,
    market: "en",
  };
}

// ============================================================
// Combined Check
// ============================================================

export interface DualComplianceResult {
  zh?: ComplianceResult;
  en?: ComplianceResult;
  allPassed: boolean;
}

export function checkCompliance(
  content: { zh?: string; en?: string }
): DualComplianceResult {
  const zh = content.zh ? checkZh(content.zh) : undefined;
  const en = content.en ? checkEn(content.en) : undefined;

  const allPassed =
    (zh === undefined || zh.passed) &&
    (en === undefined || en.passed);

  return { zh, en, allPassed };
}
