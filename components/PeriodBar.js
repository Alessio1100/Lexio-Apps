"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  PERIODS,
  PERIOD_LABELS,
  periodLabel,
  getPeriodRange,
  shiftPeriod,
} from "../lib/periods";

export default function PeriodBar({ period, setPeriod, refDate, setRefDate, day, anchors = null }) {
  const range = getPeriodRange(period, refDate, day, anchors);
  return (
    <div>
      <div className="periodchips">
        {PERIODS.map((p) => (
          <button
            key={p}
            className={`pchip ${p === period ? "active" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>
      <div className="periodnav">
        <button
          className="pstep"
          onClick={() => setRefDate(shiftPeriod(period, refDate, day, -1, anchors))}
          aria-label="Periodo precedente"
        >
          <ChevronLeft size={18} strokeWidth={2.4} />
        </button>
        <div className="plabel">{periodLabel(period, range)}</div>
        <button
          className="pstep"
          onClick={() => setRefDate(shiftPeriod(period, refDate, day, 1, anchors))}
          aria-label="Periodo successivo"
        >
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
