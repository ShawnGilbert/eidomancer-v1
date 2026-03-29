import defaultProfile from "../data/defaultProfile";

export const initialState = {
  profile: defaultProfile,
  inputQuestion: "",
  activeRequest: null,
  activeCast: null,
  rawResponse: null,
  archive: [],
  status: {
    phase: "idle",
    message: "Ask a question to begin.",
    error: "",
  },
  ui: {
    interpretationTab: "interpretation",
  },
};