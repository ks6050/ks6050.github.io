// ============================================
// PASTE YOUR API KEYS BELOW
// ============================================
const CLAUDE_API_KEY = "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";
const OPENAI_API_KEY = "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";

// State
let selectedLens = null;

// ============================================
// LENS DEFINITIONS
// ============================================
const lensPrompts = {
    agitate: `You are rewriting a news article through the "Agitate" lens. Your goal is to make the reader feel personally threatened and furious. Someone is responsible for the danger and they are getting away with it.

Rules:
- Keep ALL the original facts. Do not invent new facts or remove real ones.
- Change the framing, word choice, emphasis, and structure to maximize fear and outrage.
- Lead with the most alarming angle. Make the reader feel like this affects them directly.
- Imply blame, negligence, or injustice without fabricating anything.
- Use urgent, visceral language. Short punchy sentences mixed with longer alarming ones.
- The reader should feel compelled to share this out of panic or anger.`,

    comfort: `You are rewriting a news article through the "Comfort" lens. Your goal is to make the reader feel reassured that everything is fine and under control.

Rules:
- Keep ALL the original facts. Do not invent new facts or remove real ones.
- Change the framing, word choice, emphasis, and structure to minimize concern.
- Lead with the most positive or reassuring angle. Downplay problems.
- Emphasize solutions, progress, expert confidence, and silver linings.
- Use calm, measured, optimistic language.
- The reader should feel like there is nothing to worry about and move on with their day.`,

    suppress: `You are rewriting a news article through the "Suppress" lens. Your goal is to make the reader feel like this story does not matter and is not worth their attention.

Rules:
- Keep ALL the original facts. Do not invent new facts or remove real ones.
- Change the framing, word choice, emphasis, and structure to make the story feel boring, routine, and forgettable.
- Bury the most important information deep in the article.
- Lead with the least interesting angle. Use passive voice and bureaucratic language.
- Make it feel like a procedural update that nobody needs to read.
- The reader should feel nothing and scroll past.`
};

const lensImageStyle = {
    agitate: "dark, dramatic, threatening, high contrast, red and orange tones, photojournalism style, urgent, chaotic",
    comfort: "bright, warm, hopeful, soft lighting, golden hour, calm, peaceful, reassuring, professional photography",
    suppress: "dull, grey, mundane, flat lighting, boring, unremarkable, stock photo style, forgettable, desaturated"
};

// ============================================
// CORS PROXIES
// ============================================
const PROXIES = [
    url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

// ============================================
// DOM ELEMENTS
// ============================================
const urlInput = document.getElementById("url-input");
const submitBtn = document.getElementById("submit-btn");
const lensSelect = document.getElementById("lens-select");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const outputEl = document.getElementById("output");
const outputHeadline = document.getElementById("output-headline");
const outputSubtitle = document.getElementById("output-subtitle");
const outputMeta = document.getElementById("output-meta");
const outputBody = document.getElementById("output-body");
const outputImageContainer = document.getElementById("output-image-container");
const outputImage = document.getElementById("output-image");

// ============================================
// LENS SELECTION
// ============================================
lensSelect.addEventListener("change", () => {
    selectedLens = lensSelect.value;
    updateSubmitButton();
});

urlInput.addEventListener("input", updateSubmitButton);

function updateSubmitButton() {
    submitBtn.disabled = !(urlInput.value.trim() && selectedLens);
}

// ============================================
// SUBMIT HANDLER
// ============================================
submitBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url || !selectedLens) return;

    showLoading();
    hideError();
    hideOutput();

    try {
        // Step 1: Fetch article via proxy
        const articleText = await fetchArticle(url);
        if (!articleText || articleText.length < 100) {
            throw new Error("Could not extract article text. Try pasting a different NPR article URL.");
        }

        // Step 2: Send to Claude API
        const rewritten = await rewriteWithClaude(articleText, selectedLens);

        // Step 3: Display text result
        displayOutput(rewritten);

        // Step 4: Generate image with Gemini
        generateImage(rewritten.imagePrompt, selectedLens);
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
});

// ============================================
// FETCH ARTICLE VIA CORS PROXY
// ============================================
async function fetchArticle(url) {
    let html = null;

    for (const makeProxyUrl of PROXIES) {
        try {
            const proxyUrl = makeProxyUrl(url);
            const response = await fetch(proxyUrl);

            if (!response.ok) continue;

            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                const data = await response.json();
                html = data.contents || data.html || null;
            } else {
                html = await response.text();
            }

            if (html && html.length > 200) break;
        } catch (e) {
            console.log("Proxy failed, trying next...", e);
            continue;
        }
    }

    if (!html) {
        throw new Error("Failed to fetch the article. All proxies failed.");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    let headline = "";
    let body = "";

    const h1 = doc.querySelector("h1");
    if (h1) headline = h1.textContent.trim();

    const storyBody = doc.querySelector("#storytext, .storytext, .story-text, article");
    if (storyBody) {
        const paragraphs = storyBody.querySelectorAll("p");
        body = Array.from(paragraphs)
            .map(p => p.textContent.trim())
            .filter(t => t.length > 20)
            .join("\n\n");
    }

    if (!body) {
        const allP = doc.querySelectorAll("p");
        body = Array.from(allP)
            .map(p => p.textContent.trim())
            .filter(t => t.length > 40)
            .join("\n\n");
    }

    return `HEADLINE: ${headline}\n\nARTICLE:\n${body}`;
}

// ============================================
// REWRITE WITH CLAUDE API
// ============================================
async function rewriteWithClaude(articleText, lens) {
    const systemPrompt = lensPrompts[lens];

    const userMessage = `Here is the original news article. Rewrite it according to your instructions.

${articleText}

Respond in this exact format and nothing else:

HEADLINE: [your rewritten headline]
SUBTITLE: [a one-sentence subtitle]
AUTHOR: [a realistic fake author name]
DATE: [today's date formatted naturally]
IMAGE_PROMPT: [a detailed image prompt that would work as a news article header photo, matching the tone and framing of your rewrite. Describe a realistic photojournalism-style scene that captures the mood of your version of the article. Do not mention any real people by name. Keep it under 50 words.]
BODY:
[your rewritten article body, with paragraph breaks]`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2000,
            messages: [
                {
                    role: "user",
                    content: systemPrompt + "\n\n" + userMessage
                }
            ]
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Claude API request failed. Check your API key.");
    }

    const data = await response.json();
    const text = data.content[0].text;

    return parseClaudeResponse(text);
}

// ============================================
// PARSE CLAUDE'S RESPONSE
// ============================================
function parseClaudeResponse(text) {
    const headlineMatch = text.match(/HEADLINE:\s*(.+)/);
    const subtitleMatch = text.match(/SUBTITLE:\s*(.+)/);
    const authorMatch = text.match(/AUTHOR:\s*(.+)/);
    const dateMatch = text.match(/DATE:\s*(.+)/);
    const imagePromptMatch = text.match(/IMAGE_PROMPT:\s*(.+)/);
    const bodyMatch = text.match(/BODY:\s*([\s\S]+)/);

    return {
        headline: headlineMatch ? headlineMatch[1].trim() : "Untitled",
        subtitle: subtitleMatch ? subtitleMatch[1].trim() : "",
        author: authorMatch ? authorMatch[1].trim() : "Staff Reporter",
        date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString(),
        imagePrompt: imagePromptMatch ? imagePromptMatch[1].trim() : "",
        body: bodyMatch ? bodyMatch[1].trim() : text
    };
}

// ============================================
// GENERATE IMAGE WITH GEMINI
// ============================================
async function generateImage(imagePrompt, lens) {
    if (!imagePrompt) return;

    const fullPrompt = `Photojournalism-style news photo: ${imagePrompt}, ${lensImageStyle[lens]}`;

    try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: fullPrompt,
                n: 1,
                size: "1024x1024",
                quality: "standard"
            })
        });

        if (!response.ok) {
            console.log("OpenAI error:", await response.text());
            return;
        }

        const data = await response.json();
        const imageUrl = data.data?.[0]?.url;

        if (imageUrl) {
            outputImage.src = imageUrl;
            outputImageContainer.classList.remove("hidden");
        } else {
            console.log("No image URL in response");
        }
    } catch (err) {
        console.log("Image generation error:", err);
    }
}

// ============================================
// DISPLAY OUTPUT
// ============================================
function displayOutput(article) {
    outputHeadline.textContent = article.headline;
    outputSubtitle.textContent = article.subtitle;
    outputMeta.textContent = `By ${article.author} · ${article.date}`;

    const paragraphs = article.body.split("\n\n").filter(p => p.trim());
    outputBody.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join("");

    outputImageContainer.classList.add("hidden");
    outputEl.classList.remove("hidden");
}

// ============================================
// UI HELPERS
// ============================================
function showLoading() {
    loadingEl.classList.remove("hidden");
}

function hideLoading() {
    loadingEl.classList.add("hidden");
}

function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
}

function hideError() {
    errorEl.classList.add("hidden");
}

function hideOutput() {
    outputEl.classList.add("hidden");
    outputImageContainer.classList.add("hidden");
}