export const layers = {
  signal: "Signal", tension: "Tension", pattern: "Pattern", insight: "Insight",
  essence: "Essence", echo: "Echo", guidance: "Guidance",
};

export const experiences = {
  ask: {
    name: "Ask Eidomancer",
    summary: "Find a next step in a decision that feels tangled.",
    label: "What’s on your mind?",
    placeholder: "I’m thinking about changing jobs. I want more freedom, but I need stable income.",
    action: "Get a reading",
    primary: ["insight", "guidance"],
  },
  pattern: {
    name: "Reveal the Pattern",
    summary: "Look at what keeps happening and what you can change.",
    label: "What keeps happening?",
    placeholder: "Describe two times it happened, what came before, and what followed.",
    action: "Explore the pattern",
    primary: ["signal", "pattern", "guidance"],
  },
};

const reflections = [
  ["A Second Signal", "One incident can stay loud in your memory. A second example can tell you whether it’s part of a pattern.", "Think of a recent surprise. Look for one time the same thing happened and one time it didn’t."],
  ["The Open Hinge", "A decision can feel final while some of its parts are still easy to reverse.", "Pick one choice you’re putting off. Name a version you could try for a week before committing."],
  ["A Crack in the Story", "A detail that doesn’t fit may tell you where your explanation needs to change.", "Find one exception to a story you tell about your life. Ask what was different that time."],
  ["The Weight of Waiting", "Waiting can buy information. It can also quietly spend time, money, or goodwill.", "For one decision, name what another week would teach you and what it would cost."],
  ["The Narrow Bridge", "Two goals can be compatible in principle and still compete for the same hour, dollar, or bit of energy.", "Name the resource two of your goals compete for. Give one of them a small, specific share today."],
  ["The Worn Path", "A habit can be held in place by what happens right before it.", "Notice what happens in the five minutes before a familiar choice. Change one part of that setup tomorrow."],
  ["The Quiet Measure", "A good outcome can look different from where you stand, especially when you bear the downside.", "Write one sentence about what would make a decision work for you. Use it to compare your options."],
  ["Room for an Exception", "A reliable pattern still has conditions. The times it breaks can show you which ones matter.", "Recall a situation that usually goes badly. What was present the last time it went well?"],
  ["The Cost of a Guess", "Two guesses can be equally plausible and carry very different costs if you’re wrong.", "Choose a small action you could live with under either of your two leading explanations."],
  ["The Unmarked Door", "A missing answer can leave several explanations open. The next useful question helps tell them apart.", "Name one piece of information that would actually change your decision. Find out how to get it."],
  ["Words and Footsteps", "Repeated choices can reveal what someone reliably makes room for, even when their intentions are unclear.", "Compare a promise with what followed on two occasions. Decide how much to rely on it next time."],
  ["The Near Future", "A long-term choice gets easier to inspect when you look at what it requires this week.", "Imagine taking one of your options. Write down the first practical commitment it would ask of you."],
  ["Under the Surface", "An outcome can recur because the conditions recur. Changing the conditions gives you a way to test that idea.", "Pick a small recurring frustration and alter one thing you control before it happens again."],
  ["The Unspent Hour", "An opportunity’s price includes the time and attention it displaces.", "Before accepting one new commitment, decide which existing activity would give it room."],
];

export function dailySignal(date = new Date()) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const [title, signal, guidance] = reflections[((day % reflections.length) + reflections.length) % reflections.length];
  return { title, signal, guidance };
}
