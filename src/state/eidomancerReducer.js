export const actionTypes = {
SET_INPUT_QUESTION: "SET_INPUT_QUESTION",
START_CAST: "START_CAST",
CAST_SUCCESS: "CAST_SUCCESS",
CAST_ERROR: "CAST_ERROR",
CLEAR_ACTIVE_CAST: "CLEAR_ACTIVE_CAST",
LOAD_ARCHIVE: "LOAD_ARCHIVE",
};

export function eidomancerReducer(state, action) {
switch (action.type) {
case actionTypes.SET_INPUT_QUESTION:
return {
...state,
inputQuestion: action.payload,
};

```
case actionTypes.START_CAST:
  return {
    ...state,
    activeRequest: action.payload,
    status: {
      phase: "running",
      message: "Casting in progress...",
      error: "",
    },
  };

case actionTypes.CAST_SUCCESS:
  return {
    ...state,
    activeCast: action.payload.cast,
    rawResponse: action.payload.rawResponse,
    archive: [action.payload.cast, ...(state.archive || [])],
    status: {
      phase: "success",
      message: "Cast completed.",
      error: "",
    },
  };

case actionTypes.CAST_ERROR:
  return {
    ...state,
    activeCast: state.activeCast,
    rawResponse: action.payload.rawResponse ?? null,
    status: {
      phase: "error",
      message: action.payload.message || "Cast failed.",
      error: action.payload.error || "Unknown error.",
    },
  };

case actionTypes.CLEAR_ACTIVE_CAST:
  return {
    ...state,
    inputQuestion: "",
    activeRequest: null,
    activeCast: null,
    rawResponse: null,
    status: {
      phase: "idle",
      message: "Ask a question to begin.",
      error: "",
    },
  };

case actionTypes.LOAD_ARCHIVE:
  return {
    ...state,
    archive: action.payload,
  };

default:
  return state;
```

}
}
