/**
 * qualify.ts — Hard lead-qualification gate for ZenRows Intel Engine.
 *
 * A post only qualifies if the combined text (title + body) matches at least
 * one of the HIGH-INTENT scraping signals below OR one of the SYMPTOM signals.
 * Symptom signals catch developer pain points that are solved by ZenRows'
 * Web Scraping API (Cloudflare bypass, anti-bot evasion, headless browser handling).
 */

// ---------------------------------------------------------------------------
// High-intent scraping / anti-bot signals — at least ONE must match
// ---------------------------------------------------------------------------

const PROXY_SIGNALS: RegExp[] = [
  // --- Cloudflare / Turnstile ---
  /cloudflare[\s\-]?(bypass|block|detection|evad|turnstile|challenge)/i,
  /bypass[\s\-]*(cloudflare|turnstile|js[\s\-]?challenge)/i,
  /turnstile[\s\w]{0,20}(bypass|block|fail|error|challeng|solv)/i,
  /bypass[\s\w]{0,15}turnstile/i,
  /js[\s\-]?challenge/i,
  /browser[\s\-]?challenge/i,

  // --- Anti-bot systems (PerimeterX, Akamai, DataDome, Imperva) ---
  /perimeterx[\s\w]{0,20}(bypass|block|detect)/i,
  /(akamai|imperva|shape[\s\-]*security)[\s\w]{0,20}(bypass|block|detect)/i,
  /datadome[\s\-]?(block|detect|bypass|error|challenge|protection)/i,
  /blocked[\s\w]{0,20}datadome/i,
  /\bdatadome\b/i,
  /anti[\s\-]?bot[\s\-]*(bypass|detect|evad|circumvent)/i,
  /bot[\s\-]*(detect(ed|ion)|fingerprint)/i,

  // --- Playwright / Puppeteer / headless automation failures ---
  /playwright[\s\w]{0,20}(timeout|block|detect|captcha|fail|error|challeng)/i,
  /puppeteer[\s\w]{0,20}(captcha|block|detect|timeout|fail|challeng|ban)/i,
  /(playwright|puppeteer|selenium)[\s\w]{0,30}(block|detect|banned|challeng)/i,
  /target[\s\-]?closed[\s\w]{0,20}(playwright|puppeteer|chromium)/i,
  /\bstealth(y)?[\s\-]*(mode|browser|puppeteer|playwright)\b/i,
  /headless[\s\w]{0,20}(detect|block|ban|challeng)/i,
  /automation[\s\w]{0,20}detect(ed|ion)/i,
  /fingerprint[\s\w]{0,20}(bypass|evad|detect|block)/i,

  // --- 403 / 429 / access blocks ---
  /getting[\s\-]*(403|429)\b/i,
  /\b(403|429)[\s\w]{0,15}(error|forbidden|block|too[\s\-]*many)/i,
  /\b403[\s\w]{0,10}forbidden\b/i,
  /access[\s\-]?denied[\s\w]{0,20}(scrap|crawl|automat|bot|request)/i,
  /\bblocked[\s\w]{0,15}(from[\s\w]{0,10})?(scraping|crawling|accessing|fetching)/i,

  // --- CAPTCHA bypass ---
  /captcha[\s\-]*(bypass|solv|farm|challeng)/i,
  /\brate[\s\-]*limit(ed|ing)?\b/i,

  // --- Web scraping / crawling blocks ---
  /web[\s\-]?scrap(ing|er)[\s\w]{0,20}(block|detect|ban|fail|challeng|captcha)/i,
  /(block|detect|ban)[\s\w]{0,20}web[\s\-]?scrap/i,
  /scrap(e|ing|er)[\s\S]{0,60}(block(ed)?|ban(ned)?|detect(ed)?)/i,
  /(block(ed)?|ban(ned)?)[\s\S]{0,60}scrap(e|ing|er)/i,
  /(website|site|page)[\s\w]{0,20}block(s|ed|ing)?[\s\w]{0,20}(bot|scrap|crawl|automat)/i,
  /blocked[\s\w]{0,20}(website|site|access|request)/i,

  // --- Scraping API / ZenRows use-case fit ---
  /scrap(ing|er)[\s\w]{0,20}api[\s\w]{0,20}(fail|block|timeout|error)/i,
  /residential[\s\-]*(proxy|proxies|ip|ips)/i,
  /rotat(e|ing|ion)[\s\-]*(proxy|proxies|ip)/i,
  /proxy[\s\-]*(rotation|pool|pooling)/i,
  /\bip[\s\-]*(ban(ned|s)?|block(ed|s)?)\b/i,
  /getting[\s\-]*(ip[\s\-]*)?(ban(ned)?|block(ed)?)/i,
  /need[\s\w]{0,10}(proxy|proxies|scraping[\s\w]{0,10}api|bypass[\s\w]{0,10}solution)/i,
  /looking[\s\w]{0,10}(proxy|proxies|scraping[\s\w]{0,10}solution|anti[\s\-]?bot)/i,
  /recommend(ation)?[\s\w]{0,15}(scraping[\s\w]{0,10}api|proxy|proxies)/i,
  /best[\s\w]{0,10}(scraping[\s\w]{0,10}api|proxy|proxies|anti[\s\-]?bot[\s\w]{0,10}solution)/i,
];

// ---------------------------------------------------------------------------
// Noise rejection — posts that match these are always rejected
// ---------------------------------------------------------------------------

const NOISE_PATTERNS: RegExp[] = [
  /\b(llm|gpt|chatgpt|openai|gemini|claude|anthropic)\b.*\bscrap/i,
  /\bscrap.*\b(llm|gpt|chatgpt|openai|gemini|claude|anthropic)\b/i,
  /\b(3d[\s\-]print|woodwork|gardening|cooking|recipe)\b/i,
  /\b(senior\s+engineer|software\s+engineer|full[\s\-]stack|backend\s+engineer)\b(?!.*scrap)/i,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the combined text shows clear scraping friction or anti-bot
 * pain — the developer use cases that ZenRows directly solves.
 *
 * @param title  Post/comment title or short summary
 * @param body   Post body, selftext, or comment text (may be empty string)
 */
export function qualifyPost(title: string, body: string): boolean {
  const combined = `${title} ${body}`.toLowerCase();

  for (const noise of NOISE_PATTERNS) {
    if (noise.test(combined)) return false;
  }

  for (const signal of PROXY_SIGNALS) {
    if (signal.test(combined)) return true;
  }

  return false;
}
