// Integration snippets and the AI-assistant prompt shown in the form's integration guide.
// Everything here describes what src/routes-app/s/[form_id]/+server.ts actually does,
// so keep the two in sync.

export type SnippetLang = 'html' | 'js' | 'react';

const HONEYPOT_STYLE = 'position:absolute;left:-9999px';

export function htmlSnippet(url: string): string {
	return `<form action="${url}" method="POST">
  <label>
    Your email
    <input type="email" name="email" required>
  </label>
  <label>
    Your message
    <textarea name="message" required></textarea>
  </label>

  <!-- Honeypot: keep it hidden and empty -->
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="${HONEYPOT_STYLE}">

  <button type="submit">Send</button>
</form>`;
}

export function jsSnippet(url: string): string {
	return `<form id="contact-form">
  <input type="email" name="email" required>
  <textarea name="message" required></textarea>
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="${HONEYPOT_STYLE}">
  <button type="submit">Send</button>
  <p id="form-status" role="status"></p>
</form>

<script>
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const response = await fetch('${url}', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    });
    const result = await response.json();
    if (result.ok) {
      form.reset();
      status.textContent = 'Thanks! Your message has been sent.';
    } else {
      status.textContent = result.error || 'Something went wrong. Please try again.';
    }
  });
</script>`;
}

export function reactSnippet(url: string): string {
	return `import { useState } from 'react';

const ENDPOINT = '${url}';

export function ContactForm() {
  const [status, setStatus] = useState('idle');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('sending');
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(event.currentTarget)
    });
    const result = await response.json();
    setStatus(result.ok ? 'sent' : 'error');
  }

  if (status === 'sent') return <p>Thanks! Your message has been sent.</p>;

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <textarea name="message" required />
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off"
        style={{ position: 'absolute', left: '-9999px' }} />
      <button type="submit" disabled={status === 'sending'}>Send</button>
      {status === 'error' && <p>Something went wrong. Please try again.</p>}
    </form>
  );
}`;
}

export function snippetFor(lang: SnippetLang, url: string): string {
	return lang === 'html' ? htmlSnippet(url) : lang === 'js' ? jsSnippet(url) : reactSnippet(url);
}

export function aiPrompt(url: string): string {
	const fence = '```';
	return `I have created a Formlite form (Formlite is a self-hosted form backend) with this endpoint:
${url}

Please connect a form on my website to it. Below is how the endpoint behaves, followed by three integration options: Basic HTML, JavaScript (fetch) and React. Pick the option that best matches my website and hosting, and tailor the form fields to my needs.

---

# How the endpoint works

- Send a POST request to the endpoint. Every named field is stored, emailed to me and forwarded to my webhooks.
- Accepted bodies: application/x-www-form-urlencoded, multipart/form-data (file inputs are ignored) or application/json (a flat object).
- Field names can be nested one level with brackets, for example address[city].
- If a field named email (or reply_to, which wins) holds a valid address, my notification email uses it as Reply-To.
- Spam protection: add a hidden text field named _gotcha and leave it empty. Submissions where it is filled are silently dropped.
- A plain HTML form post gets a 303 redirect to my thank-you page.
- With the header "Accept: application/json" the endpoint answers with JSON instead: {"ok": true} on success, or {"ok": false, "error": "..."} with status 400 (invalid body), 403 (origin not allowed), 410 (form paused) or 429 (too many submissions, see Retry-After).
- CORS is handled by the endpoint. No API key, CAPTCHA or extra header is needed.

---

# Option 1: Basic HTML

Point the form's action at the endpoint and set the method to POST:

${fence}html
${htmlSnippet(url)}
${fence}

---

# Option 2: JavaScript (fetch, no page reload)

${fence}html
${jsSnippet(url)}
${fence}

---

# Option 3: React

${fence}jsx
${reactSnippet(url)}
${fence}

---

Based on my tech stack, apply the matching option and suggest any code changes needed.`;
}

function escapeHtml(s: string) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const KEYWORDS =
	/^(const|let|var|await|async|function|return|import|from|export|if|else|new|true|false)$/;

/**
 * Tiny highlighter for the snippets above: tags and keywords in mint (.k), strings in
 * amber (.s), comments dimmed. Output is escaped, so it is safe for {@html}.
 */
export function highlight(code: string): string {
	return code.replace(
		/(<!--[\s\S]*?-->|\/\/[^\n]*)|(=>)|(<\/?[A-Za-z][\w.]*)|(\/?>)|("[^"\n]*"|'[^'\n]*'|`[^`]*`)|([A-Za-z_$][\w$]*)|([^<>"'`A-Za-z_$/=]+|[\s\S])/g,
		(_m, comment, arrow, tagOpen, tagClose, str, word, other) => {
			if (comment) return `<span style="opacity:.55">${escapeHtml(comment)}</span>`;
			if (arrow) return escapeHtml(arrow);
			if (tagOpen || tagClose) return `<span class="k">${escapeHtml(tagOpen ?? tagClose)}</span>`;
			if (str) return `<span class="s">${escapeHtml(str)}</span>`;
			if (word) return KEYWORDS.test(word) ? `<span class="k">${word}</span>` : word;
			return escapeHtml(other ?? '');
		}
	);
}
