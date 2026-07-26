# PLAYBOOK: Driving Claude Design (how the app gets built)
Project: https://claude.ai/design/p/56b805f6-d4d3-4ee4-b8ab-c51ed711a3b9
- The chat input is bottom-left ("Describe what you want to create..."). Target it by element ref (find "textbox
  Describe what you want to create"); a blind coordinate click can hit the model dropdown instead.
- Typing a long prompt may return a CDP timeout, but the text USUALLY still lands — before clicking Send, verify the
  input's textContent (screenshot or read it). Then click the "Send (Enter)" button by ref.
- One scoped prompt per shift. State exactly what to change AND what NOT to touch (quote the DO-NOT-TOUCH list).
- Don't interrupt a build in progress (chat shows Thinking/Searching/Reading/Editing; tab title gets a ✶). If it's
  mid-build, do other work and let a later shift verify.
- Preview: use the standalone "Present" view for a more stable preview. The nested preview has intermittent
  click-registration flakiness — retry, click directly on glyphs, or use javascript_tool element.click() as needed.
- Get the built file: version dropdown (top-center) -> the file row "..." -> Download (goes to Downloads; see kb/deploy.md).
- If Design shows a usage-limit/paused banner: log it and stop; a later shift retries.
