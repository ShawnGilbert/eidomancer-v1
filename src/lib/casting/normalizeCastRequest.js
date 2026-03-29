export function normalizeCastRequest(question, profile) {
  const cleanedQuestion = (question || "").trim();

  return {
    question: cleanedQuestion,
    timestamp: new Date().toISOString(),
    theme: profile?.theme || "emergent-ones",
  };
}