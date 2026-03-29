import { actionTypes } from "../../state/eidomancerReducer";
import { useEidomancer } from "../../state/EidomancerContext";

const suggestedPrompts = [
"What pattern am I standing inside right now?",
"What am I refusing to admit to myself?",
"What should I focus on over the next 7 days?",
"What is draining my momentum?",
"What wants to emerge if I stop resisting it?",
];

export default function CastInputPanel({ onCast }) {
const { state, dispatch } = useEidomancer();

return ( <section className="panel hero-panel"> <p className="eyebrow">The Emergent Ones</p> <h1 className="hero-title">Eidomancer</h1>

```
  <p className="hero-copy">
    Ask a real question. Receive a symbolic cast. A modern, adaptive system
    for navigating uncertainty through pattern, tension, and insight.
  </p>

  <p className="hero-subcopy">
    Not Tarot—but a fluid, evolving reflection system that adapts as reality shifts.
  </p>

  <label className="field-label" htmlFor="cast-question">
    Your question
  </label>

  <textarea
    id="cast-question"
    className="question-input"
    value={state?.inputQuestion || ""}
    onChange={(event) =>
      dispatch({
        type: actionTypes.SET_INPUT_QUESTION,
        payload: event.target.value,
      })
    }
    placeholder="What pattern am I standing inside right now?"
    rows={5}
  />

  <div className="prompt-group">
    {suggestedPrompts.map((prompt) => (
      <button
        key={prompt}
        type="button"
        className="chip-button"
        onClick={() =>
          dispatch({
            type: actionTypes.SET_INPUT_QUESTION,
            payload: prompt,
          })
        }
      >
        {prompt}
      </button>
    ))}
  </div>

  <div className="button-row">
    <button
      type="button"
      className="primary-button"
      onClick={() => {
                onCast();
      }}
    >
      Cast
    </button>

    <button
      type="button"
      className="secondary-button"
      onClick={() => dispatch({ type: actionTypes.CLEAR_ACTIVE_CAST })}
    >
      Clear
    </button>
  </div>
</section>

);
}
