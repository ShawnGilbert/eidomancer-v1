import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { eidomancerReducer, actionTypes } from "./eidomancerReducer";
import { initialState } from "./initialState";

const EidomancerContext = createContext(null);

const ARCHIVE_KEY = "eidomancer-archive-v1";

export function EidomancerProvider({ children }) {
  const [state, dispatch] = useReducer(eidomancerReducer, initialState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ARCHIVE_KEY);
      if (saved) {
        dispatch({
          type: actionTypes.LOAD_ARCHIVE,
          payload: JSON.parse(saved),
        });
      }
    } catch (error) {
      console.error("Failed to load archive", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(state.archive));
    } catch (error) {
      console.error("Failed to save archive", error);
    }
  }, [state.archive]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <EidomancerContext.Provider value={value}>{children}</EidomancerContext.Provider>;
}

export function useEidomancer() {
  const context = useContext(EidomancerContext);

  if (!context) {
    throw new Error("useEidomancer must be used inside an EidomancerProvider");
  }

  return context;
}