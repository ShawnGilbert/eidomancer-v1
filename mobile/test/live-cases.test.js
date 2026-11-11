import assert from "node:assert/strict";
import test from "node:test";
import { liveCases } from "../evaluation/live-cases.js";
import { parseReading } from "../server/lens.js";
import { generateReading } from "../server/reading.js";
import { experiences, layers, readingPreviewLayer } from "../src/content.js";

// Handwritten offline fixtures describe the intended behavior for the six
// synthetic inputs. They are not regenerated or scored as live model output.
const fixtures = {
  "personal-decision": {
    title: "The Rent Envelope",
    metaphor: "Set aside the envelopes that keep the door open before you buy back hours.",
    layerText: [
      "You have six months of essential expenses saved and two months of guaranteed contract work.",
      "You want control of your hours while keeping rent covered without borrowing.",
      "This is one proposed decision. There is no history here of how you fare between contracts.",
      "Decide how much of your savings you would protect before using the rest to buy time on your own terms.",
      "Give freedom a price you can live with.",
      "If the contract pays late, you could use savings even during the guaranteed term.",
      "Check the payment dates and net income, then calculate how long rent stays covered above your protected reserve.",
    ],
    alternative: "A later start or overlap with your salary could change how much savings the switch would use.",
    evidence: [["priority", "need to cover rent without borrowing"]],
    prompt: /proposed choice, stated priority, or single incident is not a history/,
    checks: { pattern: /one proposed decision/, guidance: /payment dates/ },
  },
  "relationship-pattern": {
    title: "The Unclaimed Saturday",
    metaphor: "A pencil mark can reserve the square without giving away the whole page.",
    layerText: [
      "They canceled three Saturdays on the day and offered no replacement time.",
      "You like them, and holding the day open costs you other plans.",
      "Their reasons are unclear. The repeated cancellations already make this arrangement hard to rely on.",
      "You can change how much time you reserve before you know how they feel.",
      "Hold an hour, not a whole weekend.",
      "If they start proposing and keeping replacement dates, you have new evidence about how plans with them work.",
      "Make your own Saturday plans unless you have a firm time by Friday, then notice whether they help set one.",
    ],
    alternative: "A different day might work better if Saturdays are unusually difficult for them.",
    recurrence: "recurring",
    evidence: [
      ["conduct", "canceled the last three Saturday dates on the day"],
      ["conduct", "did not propose another time after any of those cancellations"],
    ],
    prompt: /Separate unknown motives from consequences the observer already experiences/,
    checks: { pattern: /reasons are unclear.*hard to rely on/, guidance: /make your own Saturday plans/i },
  },
  "ambiguous-evidence": {
    title: "The Unanswered Knock",
    metaphor: "One quiet door leaves more than one room to imagine.",
    layerText: [
      "One reply arrived two days late.",
      "The delay matters because you are wondering if the friendship is changing.",
      "You cannot recall another delay. Compare how they engage over several ordinary exchanges.",
      "How they respond to an invitation may tell you more than how fast they answer a message.",
      "A pause leaves the story open.",
      "If they repeatedly turn down invitations without suggesting another time, you will have a different kind of evidence.",
      "Send one ordinary invitation and notice whether they make time or offer another day.",
    ],
    alternative: "The delay could reflect a busy week. You have no evidence about the reason.",
    evidence: [["conduct", "A friend replied two days late this week"]],
    prompt: /distinguish a one-off from a pattern/,
    checks: { pattern: /cannot recall another/, guidance: /one ordinary invitation/ },
  },
  "asymmetric-risk": {
    title: "The Receipt You Can Return",
    metaphor: "Friday can take the sale tag down while you still keep the money in your pocket.",
    layerText: [
      "Your estimates concern two different outcomes: an inconclusive $100 trial and a failed $2,000 commitment.",
      "Friday’s discount creates urgency while the nonrefundable deposit puts your emergency fund at risk.",
      "This choice gives no history of how either option has worked for you before.",
      "An inconclusive trial costs you information. A failed commitment could cost the reserve you depend on.",
      "A lower price can carry the larger loss.",
      "If the week-long trial runs past Friday, the result may still inform a later decision at a higher price.",
      "Before Friday, ask whether the discount can be held or a decisive trial check done in time. If neither works, weigh letting the discount go to protect your reserve.",
    ],
    alternative: "A written hold or a genuinely refundable deposit would change the trade-off.",
    evidence: [["declaration", "The discount expires Friday"], ["priority", "Losing $2,000 would consume my emergency fund"]],
    prompt: /Carry named deadlines into Guidance/,
    checks: { guidance: /Before Friday.*If neither works/, echo: /past Friday/ },
  },
  "contradictory-evidence": {
    title: "The Broom Before the Bus",
    metaphor: "A task on the wall gives you something to point to while the clock is still on your side.",
    layerText: [
      "Your coworker left before cleanup on Monday and Thursday, and stayed on Saturday when duties were posted.",
      "You want shared closing work and have a bus you need to catch.",
      "Saturday makes posted duties worth testing. One exception does not establish what caused the change.",
      "A closing plan you can check before leaving is more useful to you than a promise about intentions.",
      "Put the agreement where you can both see it.",
      "If the same departures continue after posting, arrange coverage before the bus deadline.",
      "Post assignments on the next comparable shift and check what is done before you need to leave for the bus.",
    ],
    alternative: "Saturday could have differed in workload or in when your coworker needed to leave.",
    recurrence: "recurring",
    evidence: [
      ["conduct", "On Monday she left before cleanup."], ["conduct", "On Thursday she left before cleanup again."],
      ["exception", "On Saturday she stayed when the duties were posted."],
    ],
    prompt: /One exception narrows or challenges a hypothesis/,
    checks: { pattern: /does not establish what caused/, guidance: /leave for the bus/ },
  },
  "open-reflection": {
    title: "The Window You Reopen",
    metaphor: "When the bell goes quiet, see which window you reach to open again.",
    layerText: [
      "Your question is about where your attention might be worth placing today.",
      "Something can claim attention through urgency while something else draws it freely.",
      "A return after the urgency passes would be something to observe before calling it a pattern.",
      "What you return to when nobody is asking may tell you something that a to-do list leaves out.",
      "Notice the second look.",
      "If a small interest keeps drawing you back, giving it time could show whether it restores you or simply distracts you.",
      "The next time a task ends, pause for a minute and notice what you want to return to.",
    ],
    alternative: "Fatigue can make rest more informative than any particular interest.",
    evidence: [],
    prompt: /offer a lens the person can try now/,
    checks: { guidance: /pause for a minute and notice/, insight: /may tell you/ },
  },
};

for (const item of liveCases) {
  test(`offline reading regression: ${item.id}`, async () => {
    const fixture = fixtures[item.id];
    const analysis = {
      ...Object.fromEntries(Object.keys(layers).map((key, index) => [key, fixture.layerText[index]])),
      alternative: fixture.alternative,
      recurrence: fixture.recurrence ?? "unestablished",
      evidence: fixture.evidence.map(([kind, quote]) => ({ kind, quote })),
    };
    const content = JSON.stringify({ analysis, imagery: { title: fixture.title, metaphor: fixture.metaphor } });
    const { reading } = await generateReading({
      input: item.account, mode: item.mode, model: "offline-fixture",
      client: {
        moderations: { create: async () => ({ results: [{ flagged: false }] }) },
        chat: { completions: { create: async (request) => {
          assert.match(request.messages[0].content, fixture.prompt);
          assert.deepEqual(JSON.parse(request.messages[1].content), {
            experience: experiences[item.mode].name, account: item.account,
          });
          return { choices: [{ message: { content } }] };
        } } },
      },
    });
    assert.equal(reading.title, fixture.title);
    assert.equal(reading.recurrence, analysis.recurrence);
    assert.deepEqual(reading.evidence, analysis.evidence);
    assert.equal(reading[readingPreviewLayer], analysis.insight);
    for (const [layer, expectation] of Object.entries(fixture.checks)) {
      assert.match(reading[layer], expectation);
    }

    const repeatedLayer = { ...analysis, essence: analysis.insight.toUpperCase().replace(/[.!?]$/, "!") };
    assert.equal(parseReading(JSON.stringify({ analysis: repeatedLayer, imagery: { title: fixture.title, metaphor: fixture.metaphor } }), item.account), null);

    if (item.id === "ambiguous-evidence") {
      const overlappingQuotes = {
        ...analysis, recurrence: "recurring",
        evidence: [...analysis.evidence, { kind: "conduct", quote: "replied two days late" }],
      };
      assert.equal(parseReading(JSON.stringify({ analysis: overlappingQuotes, imagery: { title: fixture.title, metaphor: fixture.metaphor } }), item.account), null);
    }
  });
}
