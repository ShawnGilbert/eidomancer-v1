export const turnstileAtTheOrchard = {
  title: "The Turnstile at the Orchard",
  sections: [
    { type: "signal", content: "The machines are reducing the labor needed to produce many goods, but they are not changing who owns the machines, land, energy, networks, or distribution systems. Access therefore remains attached to wages, credentials, and institutional approval even where production requires fewer people. The visible problem is unemployment; the deeper signal is that permission has become scarcer than the goods behind it." },
    { type: "tension", content: "Material capacity is pulling toward abundance while social legitimacy remains organized around earned scarcity. Paid work supplies income, routine, status, bargaining power, and an explanation for unequal access, so removing its productive necessity also threatens several institutions at once. The conflict is not simply workers against owners: many people defend the work test because losing it can feel like losing the moral grammar by which contribution, adulthood, and fairness are recognized." },
    { type: "pattern", content: "When an old rationing mechanism loses its material justification, systems often preserve it by moving scarcity upstream. Jobs become credential contests; public goods become eligibility procedures; abundance becomes subscription tiers; free time becomes a reputational deficit. Each added gate creates administrative labor that then serves as evidence that more labor is still necessary." },
    { type: "insight", content: "Automation does not automatically create freedom because production and permission are separate systems. The decisive political object is the access rule: who may use the output, under what conditions, and with what continuing claim over the machines and infrastructure. A society can possess abundant productive capacity while remaining experientially poor if it requires ceremonial employability before opening the gate." },
    { type: "essence", content: "An orchard heavy with fruit stands behind a waist-high turnstile. No wall surrounds it and no shortage exists inside; the barrier survives because everyone still carries a work token and cannot imagine admission without one." },
    { type: "guidance", content: "Test every automation promise against ownership, energy and maintenance costs, residual human labor, and the actual rule of access. Separate the real functions once bundled inside employment—income, contribution, routine, status, care, and bargaining power—so replacements can be designed rather than wished into existence. Judge reforms by whether they reduce permission scarcity without hiding new dependencies or merely relocating the queue." },
  ],
  core_card: {
    name: "The Turnstile at the Orchard",
    description: "A civic archetype of abundance held behind an obsolete test of deservingness. The orchard represents real productive capacity; the turnstile represents ownership and eligibility rules; the worn work token represents a moral system that once coordinated contribution but now increasingly governs permission. The card appears when a solved production problem is being mistaken for an unsolved access problem.",
    image_prompt: "Vertical 2:3 symbolic card in institutional-realist style. A vast mechanically tended orchard is heavy with ripe fruit beneath clean daylight; small autonomous harvest machines work visibly among the trees. In the immediate foreground stands one ordinary waist-high steel turnstile with a coin slot labeled WORK TOKEN. A long orderly queue of adults waits outside holding worn punched timecards, while baskets of fruit accumulate unused just beyond the gate. Show power cables, irrigation pipes, maintenance tools, and two human technicians inside the orchard so automation is not portrayed as costless or total. Restrained civic palette of oxidized steel, leaf green, paper beige, and warning amber. One clear contradiction, no fantasy portal, no supernatural figure, no slogans except the small physical label, ornate but sober card border, generous safe margins.",
  },
  echo: "The orchard is full. The turnstile is still hungry.",
};

export const turnstileRequest = {
  protocol_version: "eidomancer.agent.v0.2",
  request_id: "ab-test-001-strict",
  execution: { mode: "strict_ai" },
  input: {
    intent: "A society automates most economically necessary labor, yet income, status, and moral worth remain tied to paid employment. Rather than distributing abundance, institutions manufacture new scarcity through credentials, access, attention, and procedural complexity. What cultural conflict emerges, and what artifact could make it legible?",
    audience: "general adults living through accelerating automation",
  },
  intelligence: {
    provider: "OpenAI",
    model: "same assistant/model family as control",
    content: turnstileAtTheOrchard,
  },
  lens: { viewpoint: "global" },
  presentation: {
    theme: "industrial civic ritual",
    voice: "direct, materially grounded, unsentimental",
    imagery: ["automated abundance", "permission machinery", "queues", "unused human time"],
    visual_language: ["institutional realism", "single concrete symbolic contradiction"],
  },
};
