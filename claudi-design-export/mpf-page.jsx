/* ==================================================================
   MEMBER PROFILE — PAGE
   Header + 9 sections, wired to core data/modals/toast.
================================================================== */
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;
const DSP = window.ChiyaEstateDesignSystem_686f57;
const { Icon: IconP, Button: ButtonP, Avatar: AvatarP, Badge: BadgeP, StatCard, Textarea: TextareaP } = DSP;

const {
  MPF_NAV_FLAT, MPF_PAGE_MAP, MPF_PROPERTY_DETAILS, MPF_AGENTS_PAGE,
  MPF_MEMBER, MPF_KPIS, MPF_PORTFOLIO, MPF_SAVED, MPF_VIEWINGS, MPF_INQUIRIES,
  MPF_INIT_NOTES, MPF_TIMELINE,
  MPF_ROLE_META, MPF_PROP_STATUS_META, MPF_VIEW_STATUS_META, MPF_INQUIRY_STATUS_META,
  MPF_Sidebar, MPF_Topbar, MPF_ChangeStatusModal, MPF_AssignAgentModal, MPF_DeleteMemberModal,
  MPF_ProfToast, MPF_useToasts
} = window;

/* helper: status badge with optional leading dot */
function StatusBadge({ value, meta }) {
  const m = (meta && meta[value]) || { variant: "neutral" };
  return (
    <BadgeP variant={m.variant} size="sm" icon={m.icon} dot={m.dot} className={m.cls}>{value}</BadgeP>);
}

/* ---------- SECTION CARD shell ---------- */
function SectionCard({ icon, iconTone, title, count, desc, action, feature, flush, children }) {
  return (
    <section className={"pd-card" + (feature ? " pd-card--feature" : "")}>
      <div className="pd-card__head">
        <div className="pd-card__heading">
          <div className="pd-card__titles">
            <h2 className="pd-card__title">
              {title}
              {count != null && <span className="pd-card__count">{count}</span>}
            </h2>
            {desc && <p className="pd-card__desc">{desc}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={"pd-card__body" + (flush ? " pd-card__body--flush" : "")}>{children}</div>
    </section>);
}

/* ---------- property cell ---------- */
function PropCell({ row, mono }) {
  return (
    <div className="mpf-prop">
      <img className="mpf-prop__thumb" src={row.img} alt="" loading="lazy" />
      <div className="mpf-prop__body">
        <div className="mpf-prop__title">{row.title}</div>
        <div className={"mpf-prop__sub" + (mono ? " mpf-prop__sub--mono" : "")}>
          {mono
            ? row.id
            : <React.Fragment><IconP name="map-pin" size={12} />{row.loc}</React.Fragment>}
        </div>
      </div>
    </div>);
}

function PriceCell({ price, per }) {
  return (
    <span className="mpf-price">{price}{per && <span className="mpf-price__per">{per}</span>}</span>);
}

/* ================================================================
   BASIC INFORMATION  (icon · label · value grid — ported from Agent Details)
================================================================ */
function BasicInfo({ member, pushToast }) {
  const copy = (label, text) => {
    try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) {}
    pushToast({ tone: "default", icon: "copy", title: label + " copied", msg: text });
  };
  return (
    <div className="adh__details">
      <div className="adh__detail">
        <span className="adh__detail__icon"><IconP name="phone" size={17} /></span>
        <div className="adh__detail__text">
          <span className="adh__detail__label">Phone number</span>
          <span className="adh__detail__value">
            <span>{member.phone}</span>
            <button type="button" className="adh__copy" title="Copy phone number" aria-label="Copy phone number" onClick={() => copy("Phone number", member.phone)}><IconP name="copy" size={13} /></button>
          </span>
        </div>
      </div>

      <div className="adh__detail">
        <span className="adh__detail__icon"><IconP name="users" size={17} /></span>
        <div className="adh__detail__text">
          <span className="adh__detail__label">Member types</span>
          <div className="adh__detailchips">
            {member.types.map((t) => <span className={"adh__chip adh__chip--" + t.toLowerCase()} key={t}>{t}</span>)}
          </div>
        </div>
      </div>

      <div className="adh__detail">
        <span className="adh__detail__icon"><IconP name="mail" size={17} /></span>
        <div className="adh__detail__text">
          <span className="adh__detail__label">Email address</span>
          <span className="adh__detail__value">
            <span>{member.email}</span>
            <button type="button" className="adh__copy" title="Copy email address" aria-label="Copy email address" onClick={() => copy("Email address", member.email)}><IconP name="copy" size={13} /></button>
          </span>
        </div>
      </div>

      <div className="adh__detail">
        <span className="adh__detail__icon"><IconP name="calendar" size={17} /></span>
        <div className="adh__detail__text">
          <span className="adh__detail__label">Date added</span>
          <span className="adh__detail__value"><span>{member.joinedFull}</span></span>
        </div>
      </div>
    </div>);
}

/* ================================================================
   SECTION 3 — REAL ESTATE PORTFOLIO  (primary)
================================================================ */
function PortfolioTable({ rows, onView }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--portfolio">
        <div className="mpf-thead">
          <span className="mpf-th">Property</span>
          <span className="mpf-th">Relationship</span>
          <span className="mpf-th">Status</span>
          <span className="mpf-th">Price</span>
          <span className="mpf-th">Agent</span>
          <span className="mpf-th">Date</span>
          <span className="mpf-th mpf-th--end">Action</span>
        </div>
        {rows.map((row) =>
          <div className="mpf-trow" key={row.id + row.rel}>
            <PropCell row={row} />
            <div className="mpf-cell">
              <span className="mpf-cell__label">Relationship</span>
              <BadgeP variant={(MPF_ROLE_META[row.rel] || {}).variant} size="sm">{row.rel}</BadgeP>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Status</span>
              <StatusBadge value={row.status} meta={MPF_PROP_STATUS_META} />
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Price</span>
              <PriceCell price={row.price} per={row.per} />
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Agent</span>
              <span className="mpf-agentcell">
                <AvatarP name={row.agent} size="xs" />
                <span className="mpf-agentcell__name">{row.agent}</span>
              </span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Date</span>
              <span className="mpf-date">{row.date}</span>
            </div>
            <div className="mpf-cell mpf-cell--end mpf-cell--action">
              <a className="mpf-viewbtn" href={MPF_PROPERTY_DETAILS} title="View property" aria-label={"View " + row.title}
                onClick={(e) => onView(e, row)}>
                <IconP name="arrow-up-right" size={17} />
              </a>
            </div>
          </div>)}
      </div>
    </div>);
}

/* ================================================================
   SECTION 4 — SAVED PROPERTIES
================================================================ */
function SavedTable({ rows, onView }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--saved">
        <div className="mpf-thead">
          <span className="mpf-th">Property</span>
          <span className="mpf-th">Location</span>
          <span className="mpf-th">Price</span>
          <span className="mpf-th">Date saved</span>
        </div>
        {rows.map((row) =>
          <div className="mpf-trow" key={row.id} style={{ cursor: "pointer" }} onClick={(e) => onView(e, row)}>
            <PropCell row={row} mono />
            <div className="mpf-cell">
              <span className="mpf-cell__label">Location</span>
              <span className="mpf-prop__sub"><IconP name="map-pin" size={12} />{row.loc}</span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Price</span>
              <PriceCell price={row.price} per={row.per} />
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Date saved</span>
              <span className="mpf-date">{row.saved}</span>
            </div>
          </div>)}
      </div>
    </div>);
}

/* ================================================================
   SECTION 5 — VIEWING REQUESTS
================================================================ */
function ViewingsTable({ rows }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--viewings">
        <div className="mpf-thead">
          <span className="mpf-th">Property</span>
          <span className="mpf-th">Requested date</span>
          <span className="mpf-th">Assigned agent</span>
          <span className="mpf-th">Status</span>
        </div>
        {rows.map((row, i) =>
          <div className="mpf-trow" key={row.id + i}>
            <PropCell row={row} />
            <div className="mpf-cell">
              <span className="mpf-cell__label">Requested date</span>
              <span className="mpf-date">{row.requested}</span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Assigned agent</span>
              <span className="mpf-agentcell">
                <AvatarP name={row.agent} size="xs" />
                <span className="mpf-agentcell__name">{row.agent}</span>
              </span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Status</span>
              <StatusBadge value={row.status} meta={MPF_VIEW_STATUS_META} />
            </div>
          </div>)}
      </div>
    </div>);
}

/* ================================================================
   SECTION 6 — INQUIRIES
================================================================ */
function InquiriesTable({ rows }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--inquiries">
        <div className="mpf-thead">
          <span className="mpf-th">Property</span>
          <span className="mpf-th">Inquiry type</span>
          <span className="mpf-th">Date</span>
          <span className="mpf-th">Status</span>
        </div>
        {rows.map((row, i) =>
          <div className="mpf-trow" key={row.id + i}>
            <PropCell row={row} />
            <div className="mpf-cell">
              <span className="mpf-cell__label">Inquiry type</span>
              <span className="mpf-date" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{row.type}</span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Date</span>
              <span className="mpf-date">{row.date}</span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Status</span>
              <StatusBadge value={row.status} meta={MPF_INQUIRY_STATUS_META} />
            </div>
          </div>)}
      </div>
    </div>);
}

/* ================================================================
   SECTION 8 — INTERNAL NOTES
================================================================ */
const NOTE_KIND = {
  approval: { icon: "check-circle", cls: "is-approval" },
  review: { icon: "shield-check", cls: "is-review" },
  note: { icon: "message-square", cls: "is-note" }
};
const NOTE_MAX = 500;
function noteRoleLabel(role) {
  const r = (role || "").trim();
  if (!r) return "Note";
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() + " note";
}
function NoteComposer({ spaced, onSave, onCancel }) {
  const [draft, setDraft] = useStateP("");
  const text = draft.trim();
  const remaining = NOTE_MAX - draft.length;
  const save = () => { if (text) onSave(text); };
  const onKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); save(); }
  };
  return (
    <div className={"pd-notecomposer" + (spaced ? " is-spaced" : "")}>
      <TextareaP
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        maxLength={NOTE_MAX}
        aria-label="New internal note"
        placeholder="Add a note about verification, approvals, or reminders for this member…" />
      <div className="pd-notecomposer__foot">
        <span className={"pd-notecomposer__hint" + (remaining <= 50 ? " is-low" : "")}>{remaining} characters left</span>
        <div className="pd-notecomposer__actions">
          <ButtonP hierarchy="ghost" size="sm" onClick={onCancel}>Cancel</ButtonP>
          <ButtonP hierarchy="primary" size="sm" disabled={!text} onClick={save}>Add note</ButtonP>
        </div>
      </div>
    </div>);
}
function NotesSection({ notes, onAdd, onDelete }) {
  const [composing, setComposing] = useStateP(false);
  const handleSave = (text) => { onAdd(text); setComposing(false); };
  return (
    <SectionCard title="Internal notes" count={notes.length}
      desc="Admin-only remarks and history. Never visible to the member."
      action={!composing && <ButtonP hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setComposing(true)}>Add note</ButtonP>}>
      {composing && <NoteComposer spaced={notes.length > 0} onSave={handleSave} onCancel={() => setComposing(false)} />}
      {notes.length === 0 ?
      (!composing &&
      <div className="pd-noagent">
        <span className="pd-noagent__art"><IconP name="sticky-note" size={24} strokeWidth={1.6} /></span>
        <p>No internal notes yet. Add an admin-only note to track verification, approvals, or reminders for this member.</p>
      </div>) :
      <div className="pd-notes">
        {notes.map((n, i) => {
          const k = NOTE_KIND[n.kind] || NOTE_KIND.note;
          return (
            <div className={"pd-noteitem " + k.cls} key={i}>
              <div className="pd-note__head">
                <span className="pd-note__label">{noteRoleLabel(n.role)}</span>
                <button type="button" className="pd-note__delete"
                  aria-label={"Delete note from " + n.author} title="Delete note"
                  onClick={() => onDelete && onDelete(i)}>
                  <IconP name="trash-2" size={15} />
                </button>
              </div>
              <div className="pd-note">
                <div className="pd-note__body">
                  <p className="pd-note__text">{n.text}</p>
                  <span className="pd-note__time">{n.time}</span>
                </div>
              </div>
            </div>);
        })}
      </div>}
    </SectionCard>);
}
function MPF_DeleteNoteModal({ note, onCancel, onConfirm }) {
  useEffectP(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const label = noteRoleLabel(note.role).toLowerCase();
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="mpf-delnote-title">
        <div className="pp-modal__icon">
          <IconP name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="mpf-delnote-title">Delete note?</h2>
        <p className="pp-modal__body">
          Are you sure you want to delete this <strong>{label}</strong>? This action cannot be undone and will permanently remove it from this member.
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}><IconP name="trash-2" size={15} />Delete note</button>
        </div>
      </div>
    </div>,
    document.body);
}

/* ================================================================
   SECTION 9 — ACTIVITY TIMELINE
================================================================ */
const TL_TONE = {
  brand: "#7F56D9", success: "#15B79E", info: "#2E90FA",
  warning: "#EAB308", error: "#F04438", gold: "#EE46BC", neutral: "#6172F3"
};
function Timeline({ items }) {
  return (
    <ul className="pd-timeline">
      {items.map((it, i) =>
        <li className="pd-tl" key={i}>
          <span className="pd-tl__dot" style={{ background: TL_TONE[it.tone], boxShadow: `0 0 0 4px color-mix(in srgb, ${TL_TONE[it.tone]} 16%, transparent)` }}><IconP name={it.icon} size={13} strokeWidth={2.2} /></span>
          <div className="pd-tl__body">
            <div className="pd-tl__top">
              <span className="pd-tl__title">{it.title}</span>
              <span className="pd-tl__time">{it.time}</span>
            </div>
            <p className="pd-tl__desc">{it.desc}</p>
          </div>
        </li>)}
    </ul>);
}

/* ================================================================
   APP
================================================================ */
function App() {
  const m = MPF_MEMBER;
  const [collapsed, setCollapsed] = useStateP(() => window.innerWidth >= 768);
  const [drawerOpen, setDrawerOpen] = useStateP(false);
  const [openMenu, setOpenMenu] = useStateP(null);
  const [moreOpen, setMoreOpen] = useStateP(false);

  const [status, setStatus] = useStateP(m.status);
  const [agent, setAgent] = useStateP(m.agent);
  const [notes, setNotes] = useStateP(MPF_INIT_NOTES);
  const [noteToDelete, setNoteToDelete] = useStateP(null);
  const [modal, setModal] = useStateP(null); // 'status' | 'assign' | 'delete'

  const [toasts, pushToast, dismissToast] = MPF_useToasts();
  const moreRef = useRefP(null);

  useEffectP(() => {
    const onClick = (e) => {
      if (openMenu && !e.target.closest(".ax-tb-actions")) setOpenMenu(null);
      if (moreOpen && moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu, moreOpen]);

  const go = (file) => { if (file) window.location.href = file; };
  const navSelect = (id) => { setDrawerOpen(false); go(MPF_PAGE_MAP[id]); };
  const viewProperty = (e) => { /* allow default <a> nav to property details */ };

  const statusVariant = status === "Active" ? "success" : status === "Suspended" ? "error" : "neutral";

  return (
    <div className={"ax-app" + (collapsed ? " is-collapsed" : "")}>
      <MPF_Sidebar collapsed={collapsed} drawerOpen={drawerOpen} active="members"
        onSelect={navSelect} onToggleCollapse={() => setCollapsed((v) => !v)} />
      {drawerOpen && <div className="ax-scrim" onClick={() => setDrawerOpen(false)} />}

      <div className="ax-main">
        <MPF_Topbar openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />

        <main className="ax-content">
          {/* ---------- HEADER ---------- */}
          <header className="pd-head">
            <nav className="pd-breadcrumb" aria-label="Breadcrumb">
              <a href={MPF_PAGE_MAP.dashboard}>Dashboard</a>
              <IconP name="chevron-right" size={14} />
              <a href={MPF_PAGE_MAP.members}>Members</a>
              <IconP name="chevron-right" size={14} />
              <span aria-current="page">{m.name}</span>
            </nav>

            <div className="pd-head__main">
              <div className="pd-head__identity">
              <AvatarP src={m.img} name={m.name} size="xl" className="pd-head__avatar" />
              <div className="pd-head__intro">
                <div className="pd-head__titlerow">
                  <h1 className="pd-head__title">{m.name}</h1>
                  <BadgeP variant={statusVariant} dot>{status}</BadgeP>
                </div>
                <div className="pd-head__meta">
                  <span className="pd-head__metaitem pd-head__metaitem--id"><IconP name="hash" size={13} />{m.id}</span>
                  <span className="pd-head__sep" />
                  <span className="pd-head__metaitem"><IconP name="calendar" size={14} />Member since {m.joinedShort}</span>
                </div>
              </div>
              </div>

              <div className="pd-head__actions">
                <ButtonP hierarchy="secondary" iconLeading="refresh-cw" onClick={() => { setMoreOpen(false); setModal("status"); }}>Change status</ButtonP>
                <ButtonP hierarchy="primary" iconLeading="pencil" onClick={() => pushToast({ tone: "brand", icon: "pencil", title: "Edit member", msg: "Opening the editor for " + m.name + "." })}>Edit member</ButtonP>
                <div className="pd-morewrap" ref={moreRef}>
                  <button type="button" className={"pd-morebtn" + (moreOpen ? " is-open" : "")} aria-label="More actions" aria-haspopup="true" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
                    <IconP name="ellipsis" size={20} />
                  </button>
                  {moreOpen &&
                    <div className="pd-moremenu" role="menu">
                      <button type="button" className="pd-moreitem" role="menuitem" onClick={() => { setMoreOpen(false); setModal("assign"); }}><IconP name="user-cog" size={17} />Assign agent</button>
                      <button type="button" className="pd-moreitem" role="menuitem" onClick={() => { setMoreOpen(false); pushToast({ tone: "default", icon: "download", title: "Export started", msg: "Preparing a CRM summary for " + m.name + "." }); }}><IconP name="download" size={17} />Export summary</button>
                      <div className="pd-moremenu__sep" />
                      <button type="button" className="pd-moreitem pd-moreitem--danger" role="menuitem" onClick={() => { setMoreOpen(false); setModal("delete"); }}><IconP name="trash-2" size={17} />Delete member</button>
                    </div>}
                </div>
              </div>
            </div>
          </header>

          {/* ---------- TWO-COLUMN GRID ---------- */}
          <div className="pd-grid">
            {/* MAIN COLUMN */}
            <div className="pd-grid__main">

              {/* SECTION 1 — BASIC INFORMATION */}
              <SectionCard icon="id-card" title="Basic information"
                desc="Identity, contact details, and preferences for this member.">
                <BasicInfo member={m} pushToast={pushToast} />
              </SectionCard>

              {/* SECTION 3 — REAL ESTATE PORTFOLIO (primary) */}
              <SectionCard icon="building-2" title="Real estate portfolio" count={MPF_PORTFOLIO.length}
                desc="Every property connected to this member as buyer, seller, landlord, or tenant."
                flush>
                <PortfolioTable rows={MPF_PORTFOLIO} onView={viewProperty} />
              </SectionCard>

              {/* SECTION 5 — VIEWING REQUESTS */}
              <SectionCard icon="calendar-check" title="Viewing requests" count={MPF_VIEWINGS.length}
                desc="Scheduled and past property viewings." flush>
                <ViewingsTable rows={MPF_VIEWINGS} />
              </SectionCard>

              {/* SECTION 8 — INTERNAL NOTES */}
              <NotesSection notes={notes}
                onAdd={(text) => {
                  setNotes((ns) => [{ author: "Rêbîn Kawa", role: "Super Admin", time: "Just now", kind: "note", text }, ...ns]);
                  pushToast({ tone: "brand", icon: "check", title: "Note added", msg: "Your internal note was saved to this member." });
                }}
                onDelete={(i) => setNoteToDelete(i)} />

              {/* SECTION 9 — ACTIVITY TIMELINE */}
              <SectionCard icon="history" title="Activity timeline" desc="Chronological history of this member's account.">
                <Timeline items={MPF_TIMELINE} />
              </SectionCard>
            </div>

            {/* ASIDE COLUMN — removed */}
          </div>
        </main>
      </div>

      {/* MODALS */}
      {modal === "status" &&
        <MPF_ChangeStatusModal current={status} onCancel={() => setModal(null)}
          onConfirm={(s) => { setStatus(s); setModal(null); pushToast({ tone: s === "Suspended" ? "danger" : "brand", icon: s === "Suspended" ? "pause-circle" : "check-circle", title: "Status updated", msg: m.name + " is now " + s + "." }); }} />}
      {modal === "assign" &&
        <MPF_AssignAgentModal current={agent.name} onCancel={() => setModal(null)}
          onConfirm={(a) => { setAgent(a); setModal(null); pushToast({ tone: "brand", icon: "user-check", title: "Agent reassigned", msg: a.name + " is now the relationship agent for " + m.name + "." }); }} />}
      {modal === "delete" &&
        <MPF_DeleteMemberModal member={m} onCancel={() => setModal(null)}
          onConfirm={() => { setModal(null); pushToast({ tone: "danger", icon: "trash-2", title: "Member deleted", msg: m.name + " has been removed from Chiya Estate." }); }} />}
      {noteToDelete != null && notes[noteToDelete] &&
        <MPF_DeleteNoteModal note={notes[noteToDelete]} onCancel={() => setNoteToDelete(null)}
          onConfirm={() => {
            const removed = notes[noteToDelete];
            setNotes((ns) => ns.filter((_, i) => i !== noteToDelete));
            setNoteToDelete(null);
            pushToast({ tone: "danger", icon: "trash-2", title: "Note deleted", msg: "The internal note from " + removed.author + " was removed." });
          }} />}

      {/* TOASTS */}
      <div className="pp-toaster" aria-live="polite">
        {toasts.map((t) => <MPF_ProfToast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />)}
      </div>
    </div>);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
