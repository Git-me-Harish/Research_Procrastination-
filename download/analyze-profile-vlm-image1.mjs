// Retry script for IMAGE 1 (full-page profile screenshot).
// Downsizes with sharp (already a dep) before base64 encoding to avoid 502 gateway errors.

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import sharp from 'sharp';

const SRC = '/home/z/my-project/download/04-profile-test-05b-profile-fullpage.png';
const SCALED = '/home/z/my-project/download/04-profile-test-05b-profile-fullpage-scaled.png';
const OUT = '/home/z/my-project/download/04-profile-vlm-analysis-image1.txt';

const PROMPT = `You are a senior product designer auditing a screenshot of a "BAM!" comic-book themed productivity app Profile page.

Context: This is the FULL-PAGE screenshot of the profile page. Expected layout:
- TOP: hero card with avatar, name "Prof Hero", level badge, edit/export/retake buttons
- MIDDLE: level progress bar and 8 lifetime stats cards (grid)
- BOTTOM: procrastination type card, recent activity timeline, settings panel

Please analyze the screenshot and answer the following 5 questions in a clear, structured markdown report. Be specific and reference what you actually see.

## 1. Major UI Sections Visible
List every distinct UI section/card/panel you can identify in the screenshot (e.g. "hero card with avatar", "level progress bar", "stats grid", "settings panel", etc.). For each, note what it contains.

## 2. Comic Book Style Presence
The BAM! brand uses: textured/halftone backgrounds, bold black borders on cards, vibrant primary colors (red/blue/yellow), comic-book fonts, and inked illustration aesthetics. Rate how strongly the comic book style is visible (Strong / Moderate / Weak / Absent) and cite evidence (e.g. "bold black 3px borders around stat cards", "halftone dot pattern in header background").

## 3. Default Emoji Audit (CRITICAL)
We require ZERO default/native emoji characters anywhere on this page. Only custom SVG icons with bold outlines are allowed. Look VERY carefully for native emoji glyphs such as: ⭐ 🎯 🔥 ✨ 🚀 📊 ⚡ 🏆 💪 📈 🎉 📅 ✅ ❌ ⚠️ 📝 🔔 👤 🎨 📋 ⚙️ 🏅 📚 🧠 🛌 🍅

For each emoji you see (if any), report:
- The emoji character itself
- Approximate location (which card / which row)
- Surrounding text or label

If you see NO native emoji, explicitly state "NO default emoji detected — only SVG-style icons observed." Be thorough; check badges, stat cards, settings list, timeline items, and buttons.

## 4. Layout Issues / Overflow / Broken Components
Look for: text being cut off or truncated, overlapping elements, content overflowing card boundaries, misaligned grids, broken images (empty boxes / alt-text showing), buttons with missing labels, sections that look unfinished or empty, horizontal scrollbars, anything visually broken.

## 5. Overall Completeness & Professionalism
Is the page complete and professional-looking? Would it ship to production? Note any rough edges.

Format your reply using markdown headings exactly matching the 5 numbered sections above. Keep it factual and concrete. Output only the report.`;

async function analyze(zai, dataUrl, label) {
  const t0 = Date.now();
  const response = await zai.chat.completions.createVision({
    model: 'glm-4.6v',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });
  const ms = Date.now() - t0;
  const reply = response.choices?.[0]?.message?.content ?? JSON.stringify(response, null, 2);
  return { ms, reply };
}

async function main() {
  console.log(`Scaling ${SRC} -> ${SCALED} (max width 1100px)`);
  await sharp(SRC)
    .resize({ width: 1100, withoutEnlargement: true })
    .png({ quality: 80, compressionLevel: 9 })
    .toFile(SCALED);

  const buf = fs.readFileSync(SCALED);
  console.log(`Scaled size: ${(buf.length / 1024).toFixed(1)} KB`);
  const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;

  const zai = await ZAI.create();

  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    console.log(`Attempt ${attempt}...`);
    try {
      const { ms, reply } = await analyze(zai, dataUrl, 'scaled');
      const out = [];
      out.push('=========================================================');
      out.push('IMAGE 1 (full-page profile) — VLM Analysis (GLM-4.6V)');
      out.push(`Source: ${SRC}`);
      out.push(`Scaled to: ${SCALED} (${(buf.length / 1024).toFixed(1)} KB)`);
      out.push(`Run at: ${new Date().toISOString()}`);
      out.push(`Attempt: ${attempt} (took ${ms}ms)`);
      out.push('=========================================================\n');
      out.push(reply);
      fs.writeFileSync(OUT, out.join('\n'));
      console.log(`Saved: ${OUT}`);
      console.log('--- preview ---');
      console.log(reply.slice(0, 3000));
      return;
    } catch (err) {
      lastErr = err;
      console.error(`Attempt ${attempt} failed: ${err?.message || err}`);
      // backoff
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  const out = [];
  out.push('=========================================================');
  out.push('IMAGE 1 (full-page profile) — VLM Analysis FAILED');
  out.push(`Source: ${SRC}`);
  out.push(`Run at: ${new Date().toISOString()}`);
  out.push('=========================================================\n');
  out.push(`All 4 attempts failed. Last error:`);
  out.push(lastErr?.stack || String(lastErr));
  fs.writeFileSync(OUT, out.join('\n'));
  console.error('All attempts failed.');
  process.exit(2);
}

main().catch((e) => {
  console.error('Unhandled:', e);
  process.exit(1);
});
