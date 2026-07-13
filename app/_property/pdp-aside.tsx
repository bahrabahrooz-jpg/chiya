"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AppointmentWidget } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { addViewing } from "@/lib/viewings";
import { property, agent, gallery } from "./data";
import { DatePicker, TimePicker } from "./datetime-picker";

export interface ActionPanelProps {
  onBook: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  className?: string;
}

export function ActionPanel({ onBook, onCall, onWhatsApp, className }: ActionPanelProps) {
  const router = useRouter();
  const { t } = useLang();
  const goProfile = () => router.push(`/agents/${agent.id}`);
  return (
    <div className={"pdp-panel " + (className || "")}>
      <div className="pdp-panel__body">
        <div
          className="pdp-agent pdp-agent--link"
          role="link"
          tabIndex={0}
          onClick={goProfile}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              goProfile();
            }
          }}
          title={`View ${agent.name}'s profile`}
        >
          <Avatar src={agent.avatar} name={agent.name} size="xl" verified={agent.verified} />
          <div className="pdp-agent__main">
            <div className="pdp-agent__name">
              {agent.name}
              {agent.verified && (
                <Badge variant="brand" size="sm" icon="badge-check">
                  {t("pdp.verified")}
                </Badge>
              )}
            </div>
            <div className="pdp-agent__rating">
              <Icon name="star" size={14} fill="currentColor" />
              {agent.rating}
              <span>({agent.reviews} {t("pdp.reviews")})</span>
            </div>
          </div>
          <Icon name="chevron-right" size={18} className="pdp-agent__go" />
        </div>

        <div className="pdp-cta">
          <button className="pdp-wa" type="button" onClick={onBook}>
            <Icon name="calendar-check" size={20} />
            {t("pdp.requestViewing")}
          </button>
          <div className="pdp-row2">
            <button className="pdp-ghost" type="button" onClick={onCall}>
              <Icon name="phone" size={17} />
              {t("pdp.call")}
            </button>
            <button className="pdp-ghost" type="button" onClick={onWhatsApp}>
              <Icon name="message-circle" size={17} />
              {t("pdp.whatsapp")}
            </button>
          </div>
        </div>

        <div className="pdp-panel__safety">
          <Icon name="shield-check" size={14} />
          {t("pdp.safe")}
        </div>
      </div>
    </div>
  );
}

export function BookModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [done, setDone] = useState(false);
  if (!open) return null;

  const submit = () => {
    addViewing({
      id: "vw-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      propertyId: property.id,
      title: property.title,
      address: property.address,
      cover: gallery[0],
      agentId: agent.id,
      agentName: agent.name,
      agentPhoto: agent.avatar,
      date,
      time,
      status: "requested",
      createdAt: Date.now(),
    });
    setDone(true);
  };
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      className="pdp-reqmodal"
      icon={done ? "calendar-check" : "calendar"}
      title={done ? t("pdp.bookDone") : t("pdp.requestAViewing")}
      subtitle={done ? t("pdp.bookConfirm") : property.title + " · " + property.address}
      footerSpread={!done}
      footer={
        done ? (
          <Button hierarchy="primary" size="md" type="button" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button hierarchy="secondary" size="md" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button hierarchy="primary" size="md" type="button" iconLeading="calendar-check" disabled={!date || !time} onClick={submit}>
              {t("pdp.requestAViewing")}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div style={{ textAlign: "center", padding: "8px 4px 12px" }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: "23px", color: "var(--text-secondary)" }}>
            Thank you. {agent.name} will contact you to confirm your viewing of {property.title}.
          </div>
        </div>
      ) : (
        <div className="pdp-bookmodal">
          <AppointmentWidget
            schedule={
              <div className="pdp-book-dt">
                <div className="pdp-book-dt__row">
                  <div className="pdp-book-dt__field">
                    <label className="pdp-book-dt__flabel" htmlFor="book-date">
                      Viewing date
                    </label>
                    <DatePicker id="book-date" value={date} onChange={setDate} placeholder="Select date" />
                  </div>
                  <div className="pdp-book-dt__field">
                    <label className="pdp-book-dt__flabel" htmlFor="book-time">
                      Viewing time
                    </label>
                    <TimePicker id="book-time" value={time} onChange={setTime} placeholder="Select time" />
                  </div>
                </div>
              </div>
            }
            agent={{ name: agent.name, avatar: agent.avatar, verified: agent.verified }}
            agentLabel="Viewing agent"
            hideCta
          />
        </div>
      )}
    </Modal>
  );
}
