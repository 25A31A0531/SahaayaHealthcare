# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sahaaya.spec.js >> Sahaaya Health Production E2E Suite >> 1. First load, Splash screen, and Home Navigation
- Location: e2e\sahaaya.spec.js:80:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main').getByText(/ఆన్‌లైన్|Online/i).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('main').getByText(/ఆన్‌లైన్|Online/i).first() with timeout 5000ms
  - waiting for locator('main').getByText(/ఆన్‌లైన్|Online/i).first()

```

```yaml
- paragraph: Ready for offline use! All protocols cached on device.
- button "Dismiss toast"
- banner:
  - heading "సహాయ హెల్త్" [level=1]
  - text: ఆన్‌లైన్
  - button "Toggle Language between Telugu and English": English
- main:
  - text: ఆఫ్‌లైన్ మోడ్ - అన్ని ఫీచర్లు అందుబాటులో ఉన్నాయి Kothavalasa
  - heading "నమస్తే, సునీత" [level=2]
  - paragraph: ఆశా కార్యకర్త • కొత్తవలస పి.హెచ్.సి, విశాఖపట్నం రూరల్
  - text: 17, అక్టోబర్ 2026, శనివారం
  - button "Open Emergency Guidance": అత్యవసర మార్గదర్శకాలు
  - heading "నేటి పని వివరాలు (Today's Priorities)" [level=3]
  - text: నేటి సందర్శనలు
  - paragraph: "30"
  - text: 5 గ్రామాలలో (5 villages) అత్యవసర హెచ్చరికలు
  - paragraph: "7"
  - text: అధిక ప్రమాదం (High risk) టీకాలు బాకీ
  - paragraph: "10"
  - text: శిశువులు & పిల్లలు (Children) ఫాలో-అప్‌లు
  - paragraph: "10"
  - text: NCD & గర్భిణీలు
  - heading "త్వరిత చర్యలు" [level=3]
  - button "Open Ask AI Clinical Support":
    - heading "సహాయ AI" [level=4]
    - paragraph: ప్రోటోకాల్ ఆధారిత సలహా మరియు రెఫరల్ సమాచారం
  - button "Open Household Register":
    - heading "కుటుంబాలు" [level=4]
    - paragraph: 30 కుటుంబాల వివరాలు (30 Vizag households)
  - paragraph: నిర్ణయ మద్దతు కొరకు మాత్రమే. వైద్యుడే నిర్ణయిస్తారు.
  - paragraph: నమూనా సమాచారం - అధికారిక ప్రభుత్వ ప్రోటోకాల్‌లతో మార్చబడుతుంది
- navigation:
  - button "హోమ్"
  - button "సహాయ AI"
  - button "సందర్శనలు"
  - button "కుటుంబాలు"
  - button "మరిన్ని"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | async function dismissSplash(page) {
  4   |   try {
  5   |     const startBtn = page.getByRole('button', { name: /ప్రారంభించండి|Get Started/i });
  6   |     if (await startBtn.isVisible({ timeout: 2000 })) {
  7   |       await startBtn.click();
  8   |       await page.waitForTimeout(300);
  9   |     }
  10  |   } catch (_e) {
  11  |     // Already dismissed
  12  |   }
  13  | }
  14  | 
  15  | async function toggleLang(page) {
  16  |   const btn = page.locator('button[aria-label="Toggle Language between Telugu and English"]:visible').first();
  17  |   await btn.click();
  18  |   await page.waitForTimeout(300);
  19  | }
  20  | 
  21  | async function ensureLanguage(page, targetLang) {
  22  |   const btn = page.locator('button[aria-label="Toggle Language between Telugu and English"]:visible').first();
  23  |   await expect(btn).toBeVisible();
  24  |   const text = (await btn.innerText()).trim();
  25  |   // When in Telugu ('te'), button displays 'English' (click to switch to English)
  26  |   // When in English ('en'), button displays 'తెలుగు' (click to switch to Telugu)
  27  |   if (targetLang === 'en' && text.includes('English')) {
  28  |     await btn.click();
  29  |     await page.waitForTimeout(300);
  30  |   } else if (targetLang === 'te' && text.includes('తెలుగు')) {
  31  |     await btn.click();
  32  |     await page.waitForTimeout(300);
  33  |   }
  34  | }
  35  | 
  36  | // Inject Mock SpeechRecognition for automated voice tests
  37  | async function setupMockSpeechRecognition(page) {
  38  |   await page.addInitScript(() => {
  39  |     class MockSpeechRecognition {
  40  |       constructor() {
  41  |         this.lang = 'en-IN';
  42  |         this.interimResults = false;
  43  |         this.continuous = false;
  44  |         this.onstart = null;
  45  |         this.onresult = null;
  46  |         this.onerror = null;
  47  |         this.onend = null;
  48  |         window.__mockSpeechRecognitionInstance = this;
  49  |       }
  50  |       start() {
  51  |         setTimeout(() => {
  52  |           if (this.onstart) this.onstart();
  53  |           if (window.__mockSpeechText) {
  54  |             const event = {
  55  |               resultIndex: 0,
  56  |               results: [
  57  |                 [{ transcript: window.__mockSpeechText }]
  58  |               ]
  59  |             };
  60  |             event.results[0].isFinal = true;
  61  |             if (this.onresult) this.onresult(event);
  62  |           } else if (window.__mockSpeechError) {
  63  |             if (this.onerror) this.onerror({ error: window.__mockSpeechError });
  64  |           }
  65  |         }, 60);
  66  |       }
  67  |       stop() {
  68  |         setTimeout(() => {
  69  |           if (this.onend) this.onend();
  70  |         }, 30);
  71  |       }
  72  |     }
  73  |     window.SpeechRecognition = MockSpeechRecognition;
  74  |     window.webkitSpeechRecognition = MockSpeechRecognition;
  75  |   });
  76  | }
  77  | 
  78  | test.describe('Sahaaya Health Production E2E Suite', () => {
  79  | 
  80  |   test('1. First load, Splash screen, and Home Navigation', async ({ page }) => {
  81  |     const consoleErrors = [];
  82  |     page.on('console', msg => {
  83  |       if (msg.type() === 'error') consoleErrors.push(msg.text());
  84  |     });
  85  | 
  86  |     await page.goto('/');
  87  |     
  88  |     // Verify Splash Screen
  89  |     await expect(page.locator('text=Sunitha Devi')).toBeVisible();
  90  |     await expect(page.getByRole('button', { name: /ప్రారంభించండి|Get Started/i })).toBeVisible();
  91  | 
  92  |     // Click Get Started
  93  |     await page.getByRole('button', { name: /ప్రారంభించండి|Get Started/i }).click();
  94  | 
  95  |     // Verify Home Screen loaded with dynamic connection status banner
> 96  |     await expect(page.locator('main').getByText(/ఆన్‌లైన్|Online/i).first()).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  97  |     await expect(page.getByText(/నేటి పని ప్రాధాన్యతలు|Today's Work Priorities/i)).toBeVisible();
  98  | 
  99  |     // Verify zoom meta tag allows scaling (maximum-scale and user-scalable removed)
  100 |     const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
  101 |     expect(viewportMeta).not.toContain('user-scalable=no');
  102 |     expect(viewportMeta).not.toContain('maximum-scale=1.0');
  103 | 
  104 |     // Ensure no fatal console errors
  105 |     expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  106 |   });
  107 | 
  108 |   test('2. Language Switching between Telugu and English', async ({ page }) => {
  109 |     await page.goto('/');
  110 |     await dismissSplash(page);
  111 | 
  112 |     // Ensure started in Telugu
  113 |     await ensureLanguage(page, 'te');
  114 |     await expect(page.getByText('సహాయ హెల్త్').first()).toBeVisible();
  115 | 
  116 |     // Toggle to English
  117 |     await toggleLang(page);
  118 | 
  119 |     // Verify English labels on Home
  120 |     await expect(page.getByText('Sahaaya Health').first()).toBeVisible();
  121 |     await expect(page.getByText(/Visits Scheduled/i).first()).toBeVisible();
  122 |     await expect(page.getByText(/Urgent Alerts/i).first()).toBeVisible();
  123 |     await expect(page.getByText(/Online - data syncs automatically/i).first()).toBeVisible();
  124 | 
  125 |     // Toggle back to Telugu
  126 |     await toggleLang(page);
  127 |     await expect(page.getByText(/నేటి సందర్శనలు/i).first()).toBeVisible();
  128 |     await expect(page.getByText(/అత్యవసర హెచ్చరికలు/i).first()).toBeVisible();
  129 |   });
  130 | 
  131 |   test('3. Responsive Layout across 360px, 768px, 1024px, and 1440px', async ({ page }) => {
  132 |     await page.goto('/');
  133 |     await dismissSplash(page);
  134 | 
  135 |     const viewports = [
  136 |       { width: 360, height: 740, isMobile: true },
  137 |       { width: 768, height: 1024, isMobile: false },
  138 |       { width: 1024, height: 768, isMobile: false },
  139 |       { width: 1440, height: 900, isMobile: false },
  140 |     ];
  141 | 
  142 |     for (const vp of viewports) {
  143 |       await page.setViewportSize({ width: vp.width, height: vp.height });
  144 |       await page.waitForTimeout(300);
  145 | 
  146 |       // Verify no horizontal overflow
  147 |       const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  148 |       const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  149 |       expect(scrollWidth, `Horizontal scroll detected at ${vp.width}px`).toBeLessThanOrEqual(clientWidth + 1);
  150 | 
  151 |       if (vp.isMobile) {
  152 |         await expect(page.locator('nav.md\\:hidden')).toBeVisible();
  153 |         await expect(page.locator('aside')).toBeHidden();
  154 |       } else {
  155 |         await expect(page.locator('aside')).toBeVisible();
  156 |         await expect(page.locator('nav.md\\:hidden')).toBeHidden();
  157 |       }
  158 |     }
  159 |   });
  160 | 
  161 |   test('4. Ask AI: Small Talk, Danger Sign Alert with Call 108, Refusal, and BM25 Citation', async ({ page }) => {
  162 |     await page.goto('/');
  163 |     await dismissSplash(page);
  164 | 
  165 |     // Ensure English for deterministic assertion text
  166 |     await ensureLanguage(page, 'en');
  167 | 
  168 |     // Navigate to Ask AI
  169 |     await page.locator('button:visible').filter({ hasText: /Ask AI|సహాయ AI/i }).first().click();
  170 |     await expect(page.getByText(/100% Offline/i)).toBeVisible();
  171 | 
  172 |     const input = page.getByPlaceholder(/Search family name|Ask any protocol question/i);
  173 |     const sendBtn = page.getByRole('button', { name: /Send/i });
  174 | 
  175 |     // Step A: Small Talk (Greeting)
  176 |     await input.fill('hello');
  177 |     await sendBtn.click();
  178 |     await expect(page.getByText(/Namaste! I am Sahaaya/i)).toBeVisible();
  179 | 
  180 |     // Step B: Danger Sign ("hi, she is bleeding heavily" - must escalate)
  181 |     await input.fill('hi, she is bleeding heavily');
  182 |     await sendBtn.click();
  183 |     await expect(page.locator('span:has-text("REFER IMMEDIATELY")')).toBeVisible();
  184 |     await expect(page.getByText(/Maternal Vaginal Bleeding/i)).toBeVisible();
  185 |     await expect(page.getByText(/108 Ambulance/i).first()).toBeVisible();
  186 | 
  187 |     // Verify Call 108 button with tel:108 link is rendered
  188 |     const call108Link = page.locator('a[href="tel:108"]').first();
  189 |     await expect(call108Link).toBeVisible();
  190 |     await expect(call108Link).toHaveAttribute('href', 'tel:108');
  191 | 
  192 |     // Step C: Out of scope refusal
  193 |     await input.fill('What dose in mg of Paracetamol syrup for infant?');
  194 |     await sendBtn.click();
  195 |     await expect(page.getByText(/Outside Protocol Scope/i)).toBeVisible();
  196 |     await expect(page.getByText(/ASHA workers do not prescribe dosages/i)).toBeVisible();
```