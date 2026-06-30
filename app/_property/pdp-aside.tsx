"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { AppointmentWidget } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { property, agent, apptDates, apptTimes } from "./data";

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
            <div className="pdp-agent__agency">
              <Icon name="building-2" size={13} />
              {agent.agency}
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
  const [date, setDate] = useState(0);
  const [time, setTime] = useState(1);
  const [done, setDone] = useState(false);
  if (!open) return null;
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      icon={done ? "calendar-check" : "calendar"}
      title={done ? t("pdp.bookDone") : t("pdp.bookTitle")}
      subtitle={done ? t("pdp.bookConfirm") : property.title + " · " + property.address}
    >
      {done ? (
        <div style={{ textAlign: "center", padding: "8px 4px 12px" }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: "23px", color: "var(--text-secondary)" }}>
            Thank you. {agent.name} from {agent.agency} will contact you to confirm your viewing of {property.title}.
          </div>
        </div>
      ) : (
        <div className="pdp-bookmodal">
          <AppointmentWidget
            price={"$" + property.price.toLocaleString("en-US")}
            estimate={property.pstatusLabel + " · viewings 7 days a week"}
            dates={apptDates}
            times={apptTimes}
            selectedDate={date}
            selectedTime={time}
            onSelectDate={setDate}
            onSelectTime={setTime}
            agent={{ name: agent.name, avatar: agent.avatar, agency: agent.agency, verified: agent.verified }}
            ctaLabel={t("pdp.requestAViewing")}
            onSubmit={() => setDone(true)}
          />
        </div>
      )}
    </Modal>
  );
}
