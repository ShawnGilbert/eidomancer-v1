function buildFallbackCast(question) {
return {
title: "Pattern Under Tension",
question,
pattern:
"You are standing inside a repeated friction between what matters and what is easiest to postpone.",
tension:
"Clarity is present, but momentum is leaking through hesitation, over-processing, or split attention.",
insight:
"The pattern is not confusion alone. It is partial knowledge without committed structure.",
advice:
"Reduce the question to one actionable move. Complete one visible step before asking the system for a deeper answer.",
echo: "Name the drag. Narrow the field. Move one stone.",
};
}

export async function generateMeaning(request) {
const response = await fetch("https://eidomancer-api.onrender.com/api/cast", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({ question: request.question }),
});

const rawText = await response.text();

if (!response.ok) {
throw new Error(`Cast request failed with status ${response.status}`);
}

if (!rawText || !rawText.trim()) {
return {
cast: buildFallbackCast(request.question),
rawResponse: null,
usedFallback: true,
error: "Empty response body returned from /api/cast.",
};
}

let parsed;

try {
parsed = JSON.parse(rawText);
} catch (error) {
return {
cast: buildFallbackCast(request.question),
rawResponse: rawText,
usedFallback: true,
error: "Response was not valid JSON.",
};
}

const hasStructuredContent =
parsed &&
typeof parsed === "object" &&
[
parsed.title,
parsed.pattern,
parsed.tension,
parsed.insight,
parsed.advice,
parsed.echo,
].some((value) => typeof value === "string" && value.trim().length > 0);

if (!hasStructuredContent) {
return {
cast: buildFallbackCast(request.question),
rawResponse: parsed,
usedFallback: true,
error: "Response JSON contained no usable cast fields.",
};
}

return {
cast: {
title: parsed.title?.trim() || "Untitled Cast",
question: request.question,
pattern: parsed.pattern?.trim() || "",
tension: parsed.tension?.trim() || "",
insight: parsed.insight?.trim() || "",
advice: parsed.advice?.trim() || "",
echo: parsed.echo?.trim() || "",
},
rawResponse: parsed,
usedFallback: false,
error: "",
};
}
