/* ============================================================
   Period-selector explorations for the Chiya Estate dashboard.
   Four refined alternatives to the heavy dark segmented control,
   all built from the existing website design-system vocabulary
   (filter chips, pill view-toggle, brand-green subtle states).
   Exported to window for the canvas host.
   ============================================================ */
const { useState } = React;

const PERIODS = [
  { id: "week",  label: "Week" },
  { id: "month", label: "Month" },
  { id: "year",  label: "Year" },
];

/* shared context frame: realistic KPI section header so each
   selector is judged in-place, not floating in a vacuum.
   The KPI cards are NOT redesigned — they appear only as faint
   placeholder silhouettes for spatial context. */
function ContextFrame({ tag, name, blurb, children }) {
  return (
    <div className="pv-frame">
      <div className="pv-frame__head">
        <div className="pv-frame__heading">
          <h2 className="pv-frame__title">KPI overview</h2>
        </div>
        {children}
      </div>
      <div className="pv-frame__kpis" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div className="pv-kpi" key={i}>
            <span className="pv-kpi__dot" />
            <span className="pv-kpi__l1" />
            <span className="pv-kpi__l2" />
          </div>
        ))}
      </div>
      <div className="pv-frame__foot">
        <span className="pv-frame__tag">{tag}</span>
        <p className="pv-frame__blurb">{blurb}</p>
      </div>
    </div>
  );
}

/* ---- Option A — light pill segmented (white sliding thumb) ---- */
function OptionA() {
  const [val, setVal] = useState("month");
  const idx = PERIODS.findIndex((p) => p.id === val);
  return (
    <ContextFrame
      tag="Option A"
      name="Light pill segmented"
      blurb="A soft, recessed track with a white sliding pill and brand-green label on the active step. Reads like the search-page view toggle — light, low-contrast, premium."
    >
      <div className="pvA" role="tablist" aria-label="Dashboard period">
        <span className="pvA__thumb" style={{ transform: `translateX(calc(${idx} * 100%))` }} />
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={val === p.id}
            className={"pvA__btn" + (val === p.id ? " is-on" : "")}
            onClick={() => setVal(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </ContextFrame>
  );
}

/* ---- Option B — filter chips (Buy / Rent vocabulary) ---- */
function OptionB() {
  const [val, setVal] = useState("month");
  return (
    <ContextFrame
      tag="Option B"
      name="Filter chips"
      blurb="Discrete rounded chips, exactly the Buy / Rent filter language from the site. Active chip uses the green-50 fill, green-600 hairline border and green-800 label — gentle, never dark."
    >
      <div className="pvB" role="group" aria-label="Dashboard period">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={val === p.id}
            className={"pvB__chip" + (val === p.id ? " is-on" : "")}
            onClick={() => setVal(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </ContextFrame>
  );
}

/* ---- Option C — minimal underline tabs ---- */
function OptionC() {
  const [val, setVal] = useState("month");
  const idx = PERIODS.findIndex((p) => p.id === val);
  return (
    <ContextFrame
      tag="Option C"
      name="Minimal underline tabs"
      blurb="No fills at all — quiet text tabs with a single brand-green indicator sliding beneath the active label. The lightest, calmest option; pure hierarchy through weight and color."
    >
      <div className="pvC" role="tablist" aria-label="Dashboard period">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={val === p.id}
            className={"pvC__tab" + (val === p.id ? " is-on" : "")}
            onClick={() => setVal(p.id)}
          >
            {p.label}
          </button>
        ))}
        <span className="pvC__ink" style={{ transform: `translateX(calc(${idx} * 100%))` }} />
      </div>
    </ContextFrame>
  );
}

/* ---- Option D — integrated header selector ---- */
function OptionD() {
  const [val, setVal] = useState("month");
  return (
    <ContextFrame
      tag="Option D"
      name="Integrated header rail"
      blurb="No container chrome — the steps live directly in the header beside a quiet label. The active step gets a barely-there green-50 backdrop, so the control feels native to the dashboard rather than bolted on."
    >
      <div className="pvD" role="group" aria-label="Dashboard period">
        <span className="pvD__lead">Showing</span>
        <div className="pvD__rail" role="tablist">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={val === p.id}
              className={"pvD__step" + (val === p.id ? " is-on" : "")}
              onClick={() => setVal(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </ContextFrame>
  );
}

Object.assign(window, { OptionA, OptionB, OptionC, OptionD });
