const React = window.React;
const { Icon, Avatar, Badge, Modal, AppointmentWidget } = window.ChiyaEstateDesignSystem_686f57;
const { useState } = React;

const PD = window.PROFILE_DATA;

// Sticky contact panel — emptied per request.
function ContactPanel({ agent, onWhatsApp, onCall, onEmail, onBook, className }) {
  return null;
}

// Book-viewing modal (reuses the design-system AppointmentWidget) — login-gated upstream.
function BookModal({ open, onClose, agent }) {
  const [date, setDate] = useState(0);
  const [time, setTime] = useState(1);
  const [done, setDone] = useState(false);
  if (!open) return null;
  return React.createElement(Modal, {
    open: true, onClose, size: "md", icon: done ? "calendar-check" : "calendar",
    title: done ? "Viewing requested" : "Book a viewing",
    subtitle: done
      ? "A verified Chiya agent will confirm within 24 hours."
      : "Choose a time that suits you to meet " + agent.name + ".",
  },
    done
      ? React.createElement("div", { style: { textAlign: "center", padding: "8px 4px 12px" } },
          React.createElement("div", { style: { fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: "23px", color: "var(--text-secondary)" } },
            "Thank you. " + agent.name + " from " + agent.agency + " will contact you to confirm your viewing."))
      : React.createElement("div", { className: "pdp-bookmodal" },
          React.createElement(AppointmentWidget, {
            price: agent.name, estimate: "Viewings 7 days a week · no obligation",
            dates: PD.apptDates, times: PD.apptTimes,
            selectedDate: date, selectedTime: time,
            onSelectDate: setDate, onSelectTime: setTime,
            agent: { name: agent.name, avatar: agent.photo, agency: agent.agency, verified: agent.verified },
            ctaLabel: "Request a viewing", onSubmit: () => setDone(true),
          })));
}

window.ProfileContactPanel = ContactPanel;
window.ProfileBookModal = BookModal;
