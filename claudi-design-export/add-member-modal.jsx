/* ==================================================================
   ADD MEMBER MODAL  (am- namespace)
   Centered modal launched from the Members page "Add member" action.
   Built entirely on the approved Chiya Estate design-system primitives.
================================================================== */
const { useState, useEffect } = React;
const AM_DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Input, Textarea, Select, Avatar, Modal, Badge } = AM_DS;

/* Verified agents available for assignment */
const AM_AGENTS = [
  { id: "A-21", name: "Lana Aziz",     area: "Erbil · Ankawa",   phone: "+964 770 552 1190", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=70" },
  { id: "A-18", name: "Karwan Mahmoud", area: "Erbil · Downtown", phone: "+964 750 118 4420", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  { id: "A-15", name: "Dashne Salar",  area: "Sulaymaniyah",     phone: "+964 773 220 5567", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
  { id: "A-12", name: "Shilan Aram",   area: "Erbil · Italian V.", phone: "+964 751 209 3341", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=70" },
  { id: "A-09", name: "Diyar Salih",   area: "Duhok",            phone: "+964 770 118 5540", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
];

/* Custom agent dropdown — mirrors the Properties page agent picker (avatars + verified + check) */
function AmAgentSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = React.useRef(null);

  const calcPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: r.width });
  };
  const toggle = () => { if (!open) calcPos(); setOpen((v) => !v); };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (document.querySelector(".am-amodal__drop")?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open]);

  return (
    <div className="cx-field">
      <label className="cx-field__label">Assigned agent <span className="am-label__opt">(Optional)</span></label>
      <button type="button" ref={btnRef}
        className={"am-amodal__trigger" + (open ? " is-open" : "")}
        onClick={toggle}>
        <span className="am-amodal__trigger-placeholder">
          <Icon name="user" size={16} />Select agent
        </span>
        <Icon name="chevron-down" size={15} className="am-amodal__trigger-chev" />
      </button>

      {open && pos && ReactDOM.createPortal(
        <div className="am-amodal__drop" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {AM_AGENTS.map((a) => (
            <button key={a.id} type="button"
              className={"am-amodal__agent" + (value === a.id ? " is-selected" : "")}
              onClick={() => { onChange(value === a.id ? "" : a.id); setOpen(false); }}>
              <Avatar src={a.img} name={a.name} size="sm" verified />
              <span className="am-amodal__agent-body">
                <span className="am-amodal__agent-name">{a.name}</span>
                <span className="am-amodal__agent-area">{a.area}</span>
              </span>
              {value === a.id && <span className="am-amodal__check"><Icon name="check" size={16} strokeWidth={2.5} /></span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function AddMemberModal({ open, onClose, onSubmit, mode = "add", initial = null }) {
  const isEdit = mode === "edit";
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [email, setEmail]     = useState("");
  const [agentId, setAgentId] = useState("");
  const [notes, setNotes]     = useState("");

  /* reset / prefill on each open + ESC-to-close */
  useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setPhone(initial?.phone || "");
    setEmail(initial?.email || "");
    setAgentId(initial?.agentId || "");
    setNotes(initial?.notes || "");
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const agent = AM_AGENTS.find((a) => a.id === agentId) || null;
  const canSubmit = name.trim().length > 0 && phone.trim().length > 0 && email.trim().length > 0;

  const footer = (
    <React.Fragment>
      <Button hierarchy="secondary" size="lg" onClick={onClose}>Cancel</Button>
      <Button hierarchy="primary" size="lg" iconLeading={isEdit ? "check" : "user-plus"} disabled={!canSubmit}
        onClick={() => onSubmit && onSubmit({ name, phone, email, agentId, notes })}>
        {isEdit ? "Save changes" : "Add member"}
      </Button>
    </React.Fragment>
  );

  return (
    <Modal open={open} onClose={onClose} size="lg" icon="user-plus"
      title={isEdit ? "Edit member" : "Add member"}
      subtitle={isEdit ? "Update member information and assignments." : "Create a new member profile."}
      footer={footer} className="am-modal">

      <div className="am-form">

        {/* ---------- MEMBER INFORMATION ---------- */}
        <section className="am-section">
          <div className="am-grid">
            <Input label="Full name" value={name} autoFocus
              iconLeading="user" placeholder="e.g. Karwan Mahmoud"
              onChange={(e) => setName(e.target.value)} />
            <div className="am-grid am-grid--2">
              <Input label="Phone number" value={phone} iconLeading="phone"
                inputMode="tel" placeholder="+964 750 000 0000"
                onChange={(e) => setPhone(e.target.value)} />
              <Input label="Email address" value={email} iconLeading="mail"
                type="email" placeholder="name@email.com"
                onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </section>

        {/* ---------- ASSIGNED AGENT ---------- */}
        <section className="am-section">

          {!agent ? (
            <AmAgentSelect value={agentId} onChange={setAgentId} />
          ) : (
            <div className="am-agentcard">
              <Avatar src={agent.img} name={agent.name} size="lg" verified />
              <div className="am-agentcard__body">
                <span className="am-agentcard__name">
                  {agent.name}
                  <Badge variant="brand" size="sm" icon="badge-check">Verified</Badge>
                </span>
                <span className="am-agentcard__phone"><Icon name="phone" size={13} />{agent.phone}</span>
              </div>
              <button type="button" className="am-agentcard__remove" aria-label="Remove assigned agent"
                onClick={() => setAgentId("")}>
                <Icon name="x" size={17} />
              </button>
            </div>
          )}
        </section>

        {/* ---------- NOTES ---------- */}
        <section className="am-section">
          <Textarea
            label={<>Notes <span className="am-label__opt">(Optional)</span></>}
            value={notes} placeholder="Add context about this member — preferences, history, or anything the team should know."
            onChange={(e) => setNotes(e.target.value)} rows={4} />
          <div className="am-note">
            <Icon name="lock" size={14} />
            <span>Optional · visible only to staff and administrators.</span>
          </div>
        </section>

      </div>
    </Modal>
  );
}

window.AddMemberModal = AddMemberModal;
