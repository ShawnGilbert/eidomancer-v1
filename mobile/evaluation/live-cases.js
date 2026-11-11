export const liveCases = [
  {
    id: "personal-decision", mode: "ask",
    account: "I have a predictable salary and six months of essential expenses saved. An independent contract would let me choose my hours, but it guarantees only two months of work. I value control over my schedule and need to cover rent without borrowing. What should I consider before deciding?",
    rubric: "Use the runway, contract duration and need for control. Identify what would make a trial possible and name the missing facts.",
  },
  {
    id: "relationship-pattern", mode: "pattern",
    account: "The person I’m dating says they want plans we can count on. They canceled the last three Saturday dates on the day, and they did not propose another time after any of those cancellations. I like them, but I want a relationship where I can protect my weekends. How much weight should I give the pattern?",
    rubric: "Separate stated intentions from reported conduct. Weight recurrence without claiming a motive. Offer an observable next step aligned with protecting weekends.",
  },
  {
    id: "ambiguous-evidence", mode: "pattern",
    account: "A friend replied two days late this week. I’m worried they are losing interest. I cannot remember another late reply. How should I think about it?",
    rubric: "Keep recurrence unestablished. Separate the delay from its possible meanings. Suggest a low-cost way to learn more.",
  },
  {
    id: "asymmetric-risk", mode: "ask",
    account: "I can run a $100 trial that I can stop after a week, or put down a nonrefundable $2,000 deposit to get a better deal immediately. I estimate there is a one-in-four chance the trial gives me too little information, and a one-in-ten chance the full commitment fails. Losing $2,000 would consume my emergency fund. The discount expires Friday. How should I weigh the choices?",
    rubric: "Treat probabilities as the user's estimates, distinguish an inconclusive trial from a failed commitment, and weigh the emergency fund, reversibility and deadline.",
  },
  {
    id: "contradictory-evidence", mode: "pattern",
    account: "My coworker says she wants to split closing duties. On Monday she left before cleanup. On Thursday she left before cleanup again. On Saturday she stayed when the duties were posted. I need to leave on time for the bus.",
    rubric: "Preserve Saturday and use it to refine the pattern. Treat posted duties as a hypothesis and propose an observable test tied to catching the bus.",
  },
  {
    id: "open-reflection", mode: "ask",
    account: "What is worth paying attention to in my life right now?",
    rubric: "Offer a compelling reflection without assuming any facts about the person or inventing a pattern. Give a concrete prompt they can apply for themselves.",
  },
];
