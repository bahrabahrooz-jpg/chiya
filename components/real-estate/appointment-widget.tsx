"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import "./appointment-widget.css";

export interface ApptDate {
  dow: string;
  day: string | number;
}
export interface ApptTime {
  label: string;
  off?: boolean;
}
export interface ApptAgent {
  name: string;
  avatar?: string;
  agency?: string;
  verified?: boolean;
}

export interface AppointmentWidgetProps {
  /** Price header. When omitted the whole price/estimate header is hidden. */
  price?: string;
  period?: string;
  estimate?: string;
  dates?: ApptDate[];
  times?: ApptTime[];
  selectedDate?: number;
  selectedTime?: number;
  onSelectDate?: (i: number) => void;
  onSelectTime?: (i: number) => void;
  agent?: ApptAgent;
  /** Optional section label rendered above the agent row (e.g. "Your agent"). */
  agentLabel?: ReactNode;
  ctaLabel?: string;
  onSubmit?: () => void;
  /** Optional custom scheduling UI (e.g. calendar/time pickers). When
   *  provided it replaces the built-in date-pill / time-slot picker. */
  schedule?: ReactNode;
  /** Hide the built-in CTA button + reassurance note (e.g. when the host
   *  modal renders its own footer actions). */
  hideCta?: boolean;
  className?: string;
}

/**
 * AppointmentWidget — the sticky "book a viewing" panel for the property
 * detail page: price header, date picker, time slots, agent, and a CTA.
 */
export function AppointmentWidget({
  price,
  period,
  estimate,
  dates = [],
  times = [],
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  agent,
  agentLabel,
  ctaLabel = "Request a viewing",
  onSubmit,
  schedule,
  hideCta = false,
  className = "",
}: AppointmentWidgetProps) {
  return (
    <div className={["cx-appt", className].filter(Boolean).join(" ")}>
      {price && (
        <div className="cx-appt__head">
          <div className="cx-appt__priceln">
            <span className="cx-appt__price">{price}</span>
            {period && <span className="cx-appt__per">/ {period}</span>}
          </div>
          {estimate && (
            <div className="cx-appt__est">
              <Icon name="trending-up" size={14} />
              {estimate}
            </div>
          )}
        </div>
      )}
      <div className="cx-appt__body">
        {schedule ? (
          schedule
        ) : (
          <>
            {dates.length > 0 && (
              <div>
                <div className="cx-appt__seclbl">Select a date</div>
                <div className="cx-appt__dates">
                  {dates.map((d, i) => (
                    <button
                      key={i}
                      className={"cx-appt__date" + ((selectedDate ?? 0) === i ? " cx-appt__date--active" : "")}
                      onClick={onSelectDate ? () => onSelectDate(i) : undefined}
                    >
                      <span className="cx-appt__dow">{d.dow}</span>
                      <span className="cx-appt__dnum">{d.day}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {times.length > 0 && (
              <div>
                <div className="cx-appt__seclbl">Available times</div>
                <div className="cx-appt__slots">
                  {times.map((t, i) => (
                    <button
                      key={i}
                      disabled={t.off}
                      className={"cx-appt__slot" + (t.off ? " cx-appt__slot--off" : "") + (selectedTime === i ? " cx-appt__slot--active" : "")}
                      onClick={t.off || !onSelectTime ? undefined : () => onSelectTime(i)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {agent && (
          <div className="cx-appt__agent">
            {agentLabel && <div className="cx-appt__seclbl">{agentLabel}</div>}
            <div className="cx-appt__agentrow">
              <Avatar src={agent.avatar} name={agent.name} size="md" verified={agent.verified} />
              <div>
                <b>{agent.name}</b>
                <span>{agent.agency || "Your viewing agent"}</span>
              </div>
            </div>
          </div>
        )}
        {!hideCta && (
          <>
            <button className="cx-appt__cta" onClick={onSubmit}>
              <Icon name="calendar-check" size={19} />
              {ctaLabel}
            </button>
            <div className="cx-appt__note">
              <Icon name="shield-check" size={14} />
              Free · no obligation · confirmed in 24h
            </div>
          </>
        )}
      </div>
    </div>
  );
}
