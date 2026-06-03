/**
 * qualify.ts — Hard lead-qualification gate.
 *
 * A post only qualifies if the combined text (title + body) matches at least
 * one of the HIGH-INTENT proxy signals below.  This runs BEFORE pushLead() so
 * irrelevant content never enters the store.
 */

// ---------------------------------------------------------------------------
// High-intent proxy signals — at least ONE must match
// ---------------------------------------------------------------------------

const PROXY_SIGNALS: RegExp[] = [
  // --- Proxy rotation / pooling ---
  /rotat(e|ing|ion)[\s\-]*(proxy|proxies|ip|ips)/i,
  /proxy[\s\-]*(rotation|pool|pooling|list)/i,
  /backconnect/i,
  /rotating[\s\-]*(residential|datacenter|isp)/i,

  // --- Residential / ISP / datacenter proxies ---
  /residential[\s\-]*(proxy|proxies|ip|ips)/i,
  /\bisp[\s\-]*(proxy|proxies)\b/i,
  /datacenter[\s\-]*(proxy|proxies)\b/i,
  /mobile[\s\-]*(proxy|proxies)\b/i,

  // --- IP bans / blocking ---
  /\bip[\s\-]*(ban(ned|s)?|block(ed|s)?)\b/i,
  /\b(banned|blocked)[\s\w]{0,20}ip\b/i,
  /getting[\s\-]*(ip[\s\-]*)?(ban(ned)?|block(ed)?)/i,
  /cloudflare[\s\-]*(bypass|block|detection|evad)/i,
  /bypass[\s\-]*(cloudflare|akamai|datadome|bot|captcha|detection)/i,
  /anti[\s\-]?bot[\s\-]*(bypass|detect|evad|circumvent)/i,
  /(scraping|crawler)[\s\w]{0,20}block(ed)?/i,
  /bot[\s\-]*(detect(ed|ion)|fingerprint)/i,

  // --- Active proxy need / search ---
  /need[\s\w]{0,10}(proxy|proxies|residential)/i,
  /looking[\s\w]{0,10}(proxy|proxies|residential|scraping[\s\w]{0,10}solution)/i,
  /recommend(ation)?[\s\w]{0,15}(proxy|proxies|residential)/i,
  /(proxy|proxies)[\s\w]{0,15}recommend(ation)?/i,
  /best[\s\w]{0,10}(proxy|proxies|residential[\s\-]*proxy)/i,
  /cheap(est)?[\s\w]{0,10}(proxy|proxies|residential)/i,
  /(proxy|proxies)[\s\w]{0,10}provider/i,
  /proxy[\s\w]{0,10}service/i,
  /\bbuy[\s\w]{0,10}(proxy|proxies|residential)/i,
  /(switch(ing)?|replac(e|ing)|leav(e|ing))[\s\w]{0,20}proxy[\s\w]{0,10}provider/i,
  /frustrated[\s\w]{0,20}proxy/i,
  /proxy[\s\w]{0,30}(not[\s\-]*work(ing)?|broken|failing|detected|flagged|sucks|terrible|awful|slow)/i,

  // --- Rate limiting / captcha ---
  /captcha[\s\-]*(bypass|solv|farm|challeng)/i,
  /\brate[\s\-]*limit(ed|ing)?\b/i,
  /getting[\s\-]*(403|429)\b/i,
  /\b(403|429)[\s\w]{0,15}(error|forbidden|block|too[\s\-]*many)/i,
  /(akamai|datadome|imperva|perimeterx|shape[\s\-]*security)[\s\w]{0,20}(bypass|block|detect)/i,

  // --- Technical proxy config / credentials ---
  /\bsocks5?[\s\-]proxy\b/i,
  /proxy[\s\-]*(auth(entication)?|credentials|user(name)?|pass)/i,
  /proxy[\s\-]*(config|setup|integrat)/i,
  /\bhttp(s)?[\s\-]proxy\b/i,

  // --- Scraping + proxy together ---
  /scrap(e|ing|er)[\s\S]{0,60}(proxy|proxies|block(ed)?|ban(ned)?|detect(ed)?)/i,
  /(proxy|proxies|block(ed)?|ban(ned)?)[\s\S]{0,60}scrap(e|ing|er)/i,

  // --- Sneaker bot context ---
  /sneaker[\s\-]*(bot|proxy|proxies|cook(er)?)/i,
  /(bot|proxy|proxies)[\s\w]{0,20}sneaker/i,

  // --- Proxy-specific frustration ---
  /\bprox(y|ies)\s+(are|is|was|were|keep(s)?|keeps?|got|getting)\s+(block(ed)?|ban(ned)?|detect(ed)?|flag(ged)?|throttl)/i,
  /\b(detected|flagged|throttled)[\s\w]{0,30}prox(y|ies)\b/i,
  /\bproxy[\s\w]{0,20}(leak(s|ing)?|expos(e|ing|ed)|fingerprint)/i,
];

// ---------------------------------------------------------------------------
// Noise rejection — posts that match these are always rejected even if they
// superficially contain a proxy word.
// ---------------------------------------------------------------------------

const NOISE_PATTERNS: RegExp[] = [
  // General AI / LLM discussions that mention "scraping" in passing
  /\b(llm|gpt|chatgpt|openai|gemini|claude|anthropic)\b.*\bscrap/i,
  /\bscrap.*\b(llm|gpt|chatgpt|openai|gemini|claude|anthropic)\b/i,
  // 3D printing, woodworking, other unrelated "proxy" uses
  /\b(3d[\s\-]print|woodwork|gardening|cooking|recipe)\b/i,
  // Job listings that aren't hiring scrapers
  /\b(senior\s+engineer|software\s+engineer|full[\s\-]stack|backend\s+engineer)\b(?!.*scrap)/i,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the combined text shows clear proxy-related friction or intent.
 * Both workers must call this before pushing a lead.
 *
 * @param title  Post/comment title or short summary
 * @param body   Post body, selftext, or comment text (may be empty string)
 */
export function qualifyPost(title: string, body: string): boolean {
  const combined = `${title} ${body}`.toLowerCase();

  // Hard reject noise first (cheap check)
  for (const noise of NOISE_PATTERNS) {
    if (noise.test(combined)) return false;
  }

  // Require at least one high-intent signal
  for (const signal of PROXY_SIGNALS) {
    if (signal.test(combined)) return true;
  }

  return false;
}
