import CastInputPanel from "./components/cast/CastInputPanel";
import CastResultPanel from "./components/cast/CastResultPanel";
import ArchivePanel from "./components/archive/ArchivePanel";
import { EidomancerProvider, useEidomancer } from "./state/EidomancerContext";
import { actionTypes } from "./state/eidomancerReducer";
import { normalizeCastRequest } from "./lib/casting/normalizeCastRequest";
import { generateMeaning } from "./lib/casting/generateMeaning";
import "./index.css";

function AppContent() {
  const { state, dispatch } = useEidomancer();

  async function handleCast() {
    const request = normalizeCastRequest(state.inputQuestion, state.profile);

    if (!request.question) {
      dispatch({
        type: actionTypes.CAST_ERROR,
        payload: {
          message: "No question submitted.",
          error: "Enter a question before casting.",
          rawResponse: null,
        },
      });
      return;
    }

    dispatch({ type: actionTypes.START_CAST, payload: request });

    try {
      const result = await generateMeaning(request);

      dispatch({
        type: actionTypes.CAST_SUCCESS,
        payload: {
          cast: result.cast,
          rawResponse: result.rawResponse,
        },
      });

      if (result.usedFallback) {
        dispatch({
          type: actionTypes.CAST_ERROR,
          payload: {
            message: "Fallback cast used.",
            error: result.error,
            rawResponse: result.rawResponse,
          },
        });

        dispatch({
          type: actionTypes.CAST_SUCCESS,
          payload: {
            cast: result.cast,
            rawResponse: result.rawResponse,
          },
        });
      }
    } catch (error) {
      dispatch({
        type: actionTypes.CAST_ERROR,
        payload: {
          message: "Cast failed.",
          error: error.message,
          rawResponse: null,
        },
      });
    }
  }

  return (
    <main className="app-shell">
      <div className="main-column">
        <CastInputPanel onCast={handleCast} />
}