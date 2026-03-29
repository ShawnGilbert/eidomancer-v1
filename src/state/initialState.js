import defaultProfile from "../data/defaultProfile";

export const emptyCastResult = {
  title: "",
  question: "",
  pattern: "",
  tension: "",
  insight: "",
  advice: "",
  echo: "",
};

export const initialState = {
  profile: defaultProfile,
  inputQuestion: "",
  activeRequest: null,
  activeCast: null,
  rawResponse: null,
  archive: [],
  status: {
    phase: "idle", // idle | running | success | error
    message: "Ask a question to begin.",
    error: "",
  },
  ui: {
    interpretationTab: "interpretation",
  },
};