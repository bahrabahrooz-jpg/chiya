const React = window.React;
const { Icon, Avatar, Badge, Modal, AppointmentWidget, Button } = window.ChiyaEstateDesignSystem_686f57;
const { useState } = React;

const AD = window.PDP_DATA;
const PROFILE_PAGE = "Website-Agent Profile.html";
const goAgentProfile = () => { window.location.href = PROFILE_PAGE; };

function ActionPanel({ p, agent, favorite, onWhatsApp, onCall, onEmail, onBook, className }) {
  return React.createElement("div", { className: "pdp-panel " + (className || ""), "data-screen-label": "Contact panel" },
    React.createElement("div", { className: "pdp-panel__body" },
      // agent
      React.createElement("div", { className: "pdp-agent pdp-agent--link", role: "link", tabIndex: 0,
        onClick: goAgentProfile,
        onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goAgentProfile(); } },
        title: "View " + agent.name + "'s profile" },
        React.createElement(Avatar, { src: agent.avatar, name: agent.name, size: "xl", verified: agent.verified }),
        React.createElement("div", { className: "pdp-agent__main" },
          React.createElement("div", { className: "pdp-agent__name" }, agent.name,
            agent.verified && React.createElement(Badge, { variant: "brand", size: "sm", icon: "badge-check" }, "Verified")),
          React.createElement("div", { className: "pdp-agent__agency" },
            React.createElement(Icon, { name: "building-2", size: 13 }), agent.agency),
          React.createElement("div", { className: "pdp-agent__rating" },
            React.createElement(Icon, { name: "star", size: 14, fill: "currentColor" }), agent.rating,
            React.createElement("span", null, "(" + agent.reviews + " reviews)"))),
        React.createElement(Icon, { name: "chevron-right", size: 18, className: "pdp-agent__go" })),
      // CTAs — WhatsApp primary, Call + Email secondary
      React.createElement("div", { className: "pdp-cta" },
        React.createElement("button", { className: "pdp-wa", type: "button", onClick: onBook },
          React.createElement(Icon, { name: "calendar-check", size: 20 }), "Request viewing"),
        React.createElement("div", { className: "pdp-row2" },
          React.createElement("button", { className: "pdp-ghost", type: "button", onClick: onCall },
            React.createElement(Icon, { name: "phone", size: 17 }), "Call"),
          React.createElement("button", { className: "pdp-ghost", type: "button", onClick: onWhatsApp },
            React.createElement(Icon, { name: "message-circle", size: 17 }), "WhatsApp"))),
      React.createElement("div", { className: "pdp-panel__safety" },
        React.createElement(Icon, { name: "shield-check", size: 14 }), "Verified agent · no obligation · ID-checked")));
}

// Book-viewing modal (reuses the design system AppointmentWidget)
function BookModal({ open, onClose, p, agent }) {
  const [date, setDate] = useState(0);
  const [time, setTime] = useState(1);
  const [done, setDone] = useState(false);
  if (!open) return null;
  return React.createElement(Modal, {
    open: true, onClose, size: "md", icon: done ? "calendar-check" : "calendar",
    title: done ? "Viewing requested" : "Book a viewing",
    subtitle: done ? "A verified Chiya agent will confirm within 24 hours." : p.title + " · " + p.address,
  },
    done
      ? React.createElement("div", { style: { textAlign: "center", padding: "8px 4px 12px" } },
          React.createElement("div", { style: { fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: "23px", color: "var(--text-secondary)" } },
            "Thank you. " + agent.name + " from " + agent.agency + " will contact you to confirm your viewing of " + p.title + "."))
      : React.createElement("div", { className: "pdp-bookmodal" },
          React.createElement(AppointmentWidget, {
            price: "$" + p.price.toLocaleString("en-US"),
            estimate: p.pstatusLabel + " · viewings 7 days a week",
            dates: AD.apptDates, times: AD.apptTimes,
            selectedDate: date, selectedTime: time,
            onSelectDate: setDate, onSelectTime: setTime,
            agent: { name: agent.name, avatar: agent.avatar, agency: agent.agency, verified: agent.verified },
            ctaLabel: "Request a viewing", onSubmit: () => setDone(true),
          })));
}

window.PdpActionPanel = ActionPanel;
window.PdpBookModal = BookModal;
