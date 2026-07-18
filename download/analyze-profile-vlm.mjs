// VLM analysis of BAM! Profile page screenshots
// Uses z-ai-web-dev-sdk to send each PNG (base64) to GLM-4.6V for analysis.

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const IMAGES = [
  {
    label: 'IMAGE 1: /home/z/my-project/download/04-profile-test-05b-profile-fullpage.png',
    path: '/home/z/my-project/download/04-profile-test-05b-profile-fullpage.png',
    description: 'Full-page screenshot of the BAM! Profile page. Expected layout:\n' +
      '- TOP: hero card with avatar, name "Prof Hero", level badge, edit/export/retake buttons\n' +
      '- MIDDLE: level progress bar and 8 lifetime stats cards (grid)\n' +
      '- BOTTOM: procrastination type card, recent activity timeline, settings panel'
  },
  {
    label: 'IMAGE 2: /home/z/my-project/download/04-profile-test-06-profile-mid.png',
    path: '/home/z/my-project/download/04-profile-test-06-profile-mid.png',
    description: 'Middle section of the BAM! Profile page. Expected layout:\n' +
      '- Lifetime stats grid (8 stat cards)\n' +
      '- Possibly a KPI trend chart'
  },
  {
    label: 'IMAGE 3: /home/z/my-project/download/04-profile-test-07-profile-bottom.png',
    path: '/home/z/my-project/download/04-profile-test-07-profile-bottom.png',
    description: 'Bottom section of the BAM! Profile page. Expected layout:\n' +
      '- Recent activity timeline\n' +
      '- Settings panel'
  }
];

const PROMPT_TEMPLATE = (description) => `You are a senior product designer auditing a screenshot of a "BAM!" comic-book themed productivity app Profile page.

Context: ${description}

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

function toDataUrl(filePath) {
  const buf = fs.readFileSync(filePath);
  const b64 = buf.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png'
    : (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg'
    : ext === '.webp' ? 'image/webp'
    : ext === '.gif' ? 'image/gif'
    : 'image/png';
  return `data:${mime};base64,${b64}`;
}

async function analyzeOne(zai, image) {
  const dataUrl = toDataUrl(image.path);
  const prompt = PROMPT_TEMPLATE(image.description);

  const response = await zai.chat.completions.createVision({
    model: 'glm-4.6v',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });

  return response.choices?.[0]?.message?.content
    ?? JSON.stringify(response, null, 2);
}

async function main() {
  const out = [];
  out.push('=========================================================');
  out.push('BAM! Profile Page — VLM Analysis (GLM-4.6V)');
  out.push(`Run at: ${new Date().toISOString()}`);
  out.push('=========================================================\n');

  let zai;
  try {
    zai = await ZAI.create();
  } catch (e) {
    out.push(`FATAL: failed to init ZAI SDK: ${e?.message || e}`);
    fs.writeFileSync('/home/z/my-project/download/04-profile-vlm-analysis.txt', out.join('\n'));
    process.exit(1);
  }

  for (const image of IMAGES) {
    out.push('---------------------------------------------------------');
    out.push(image.label);
    out.push('---------------------------------------------------------');
    if (!fs.existsSync(image.path)) {
      out.push(`ERROR: file not found: ${image.path}\n`);
      continue;
    }
    try {
      const t0 = Date.now();
      const reply = await analyzeOne(zai, image);
      const ms = Date.now() - t0;
      out.push(`(analysis took ${ms}ms)\n`);
      out.push(reply || '(empty reply)');
    } catch (err) {
      out.push(`ERROR analyzing image: ${err?.message || err}`);
      if (err?.response) {
        out.push(JSON.stringify(err.response, null, 2));
      }
    }
    out.push('\n');
  }

  const reportPath = '/home/z/my-project/download/04-profile-vlm-analysis.txt';
  fs.writeFileSync(reportPath, out.join('\n'));
  console.log(`\nReport saved to: ${reportPath}`);
  console.log('--- preview ---');
  console.log(out.join('\n').slice(0, 4000));
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
