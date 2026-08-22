"use client";

import {
  PERIODS,
  PERIOD_LABELS,
  periodLabel,
  getPeriodRange,
  shiftPeriod,
} from "../lib/periods";

export default function PeriodBar({ period, setPeriod, refDate, setRefDate, day }) {
  const range = getPeriodRange(period, refDate, day);
  return (
    <div>
      <div className="chiprow">
        {PERIODS.map((p) => (
          <button
            key={p}
            className={`chip ${p === period ? "active" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>
      <div className="periodnav">
        <button
          className="arrow"
          onClick={() => setRefDate(shiftPeriod(period, refDate, day, -1))}
          aria-label="Periodo precedente"
        >
          ‹
        </button>
        <div className="plabel">{periodLabel(period, range)}</div>
        <button
          className="arrow"
          onClick={() => setRefDate(shiftPeriod(period, refDate, day, 1))}
          aria-label="Periodo successivo"
        >
          ›
        </button>
      </div>
    </div>
  );
}
