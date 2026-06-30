/* ==================================================================
   VIEWING DETAILS — PAGE
   Header + overview + property + member + agent + appointment +
   timeline + internal notes + footer. Wired to core data/modals/toast.
================================================================== */
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;
const DSP = window.ChiyaEstateDesignSystem_686f57;
const { Icon: IconP, Button: ButtonP, Avatar: AvatarP, Badge: BadgeP, Textarea: TextareaP } = DSP;

const {
  VWD_NAV_FLAT, VWD_PAGE_MAP, VWD_PROPERTY_DETAILS, VWD_MEMBER_PROFILE, VWD_AGENT_DETAILS,
  VWD_VIEWING, VWD_TIMELINE, VWD_INIT_NOTES,
  VWD_VIEW_STATUS_META, VWD_ROLE_META, VWD_adNoteRoleLabel,
  VWD_Sidebar, VWD_Topbar, VWD_ConfirmModal, VWD_ViewingStatusModal, VWD_DeleteNoteModal,
  VWD_ProfToast, VWD_useToasts
} = window;

/* ---------- SECTION CARD shell ---------- */
function SectionCard({ title, count, desc, action, flush, children }) {
  return (
    <section className="pd-card">
      <header className="pd-card__head">
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
      </header>
      <div className={"pd-card__body" + (flush ? " pd-card__body--flush" : "")}>{children}</div>
    </section>);
}

/* status badge */
function StatusBadge({ status, size }) {
  const m = VWD_VIEW_STATUS_META[status] || { variant: "neutral" };
  return <BadgeP variant={m.variant} size={size || "sm"} icon={m.icon} className={m.cls}>{status}</BadgeP>;
}

/* ================================================================
   OVERVIEW — fact grid
================================================================ */
function Fact({ icon, label, children, mono }) {
  return (
    <div className="vwd-fact">
      <span className="vwd-fact__icon"><IconP name={icon} size={17} /></span>
      <div className="vwd-fact__text">
        <span className="vwd-fact__label">{label}</span>
        <span className={"vwd-fact__value" + (mono ? " vwd-fact__value--mono" : "")}>{children}</span>
      </div>
    </div>);
}

function Overview({ v, status }) {
  return (
    <SectionCard title="Viewing overview" desc="Appointment summary, schedule, and record history.">
      <div className="vwd-facts">
        <Fact icon="hash" label="Viewing ID" mono>{v.id}</Fact>
        <Fact icon="circle-dot" label="Status"><StatusBadge status={status} /></Fact>
        <Fact icon="calendar" label="Date">{v.date}</Fact>
        <Fact icon="map-pin" label="Meeting location">{v.meetingLocation}</Fact>
        <Fact icon="alarm-clock" label="Time">{v.time} – {v.endTime}</Fact>
        <Fact icon="calendar-plus" label="Created">{v.created}</Fact>
        <Fact icon="clock" label="Duration">{v.duration}</Fact>
        <Fact icon="history" label="Last updated">{v.updated}</Fact>
      </div>
    </SectionCard>);
}

/* ================================================================
   PROPERTY INFORMATION
================================================================ */
function PropertyInfo({ p, onView }) {
  return (
    <SectionCard title="Property information" desc="The listing this viewing is scheduled for."
      action={<ButtonP hierarchy="secondary" size="sm" iconTrailing="arrow-up-right" onClick={onView}>View property</ButtonP>}>
      <div className="vwd-prop">
        <img className="vwd-prop__media" src={p.img} alt={p.name} loading="lazy" />
        <div className="vwd-prop__body">
          <div className="vwd-prop__titlerow">
            <span className="vwd-prop__name">{p.name}</span>
            <BadgeP variant={p.listing === "For sale" ? "brand" : "info"} size="sm" icon={p.listing === "For sale" ? "tag" : "key"}>{p.listing}</BadgeP>
          </div>
          <span className="vwd-prop__loc"><IconP name="map-pin" size={14} />{p.location}</span>
          <div className="vwd-prop__grid">
            <div className="vwd-prop__cell">
              <span className="vwd-prop__celllabel">Property ID</span>
              <span className="vwd-prop__cellvalue vwd-prop__cellvalue--mono">{p.id}</span>
            </div>
            <div className="vwd-prop__cell">
              <span className="vwd-prop__celllabel">Property type</span>
              <span className="vwd-prop__cellvalue">{p.type}</span>
            </div>
            <div className="vwd-prop__cell">
              <span className="vwd-prop__celllabel">Listing type</span>
              <span className="vwd-prop__cellvalue">{p.listing}</span>
            </div>
            <div className="vwd-prop__cell">
              <span className="vwd-prop__celllabel">Price</span>
              <span className="vwd-prop__cellvalue vwd-prop__price">{p.price}</span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>);
}

/* ================================================================
   APPOINTMENT DETAILS
================================================================ */
function AppointmentDetails({ v }) {
  return (
    <SectionCard title="Appointment details" desc="How the viewing will be conducted.">
      <div className="vwd-appt">
        <div className="vwd-apptgrid">
          <div className="vwd-apptitem">
            <span className="vwd-apptitem__icon"><IconP name={v.contactIcon} size={17} /></span>
            <div className="vwd-apptitem__text">
              <span className="vwd-apptitem__label">Preferred contact method</span>
              <span className="vwd-apptitem__value">{v.contactMethod}</span>
            </div>
          </div>
          <div className="vwd-apptitem">
            <span className="vwd-apptitem__icon"><IconP name="bell" size={17} /></span>
            <div className="vwd-apptitem__text">
              <span className="vwd-apptitem__label">Reminder sent</span>
              <span className="vwd-apptitem__value">
                {v.reminderSent
                  ? <React.Fragment><BadgeP variant="success" size="sm" icon="check">Yes</BadgeP></React.Fragment>
                  : <BadgeP variant="neutral" size="sm">No</BadgeP>}
              </span>
            </div>
          </div>
          <div className="vwd-apptitem">
            <span className="vwd-apptitem__icon"><IconP name="calendar-clock" size={17} /></span>
            <div className="vwd-apptitem__text">
              <span className="vwd-apptitem__label">Reminder time</span>
              <span className="vwd-apptitem__value" style={{ fontVariantNumeric: "tabular-nums" }}>{v.reminderSent ? v.reminderWhen : "—"}</span>
            </div>
          </div>
        </div>
        <div className="vwd-noteblock">
          <span className="vwd-noteblock__label"><IconP name="message-square-text" size={13} />Notes</span>
          <p className="vwd-noteblock__text">{v.notes}</p>
        </div>
      </div>
    </SectionCard>);
}

/* ================================================================
   MEMBER + AGENT  (aside cards)
================================================================ */
function ContactList({ phone, email }) {
  return (
    <div className="pd-contactlist vwd-person__contacts">
      <a className="pd-contact" href={"tel:" + phone.replace(/\s/g, "")}>
        <span className="pd-contact__icon"><IconP name="phone" size={16} /></span>
        <span className="pd-contact__text">
          <span className="pd-contact__label">Phone number</span>
          <span className="pd-contact__value">{phone}</span>
        </span>
        <IconP name="arrow-up-right" size={16} className="pd-contact__go" />
      </a>
      <a className="pd-contact" href={"mailto:" + email}>
        <span className="pd-contact__icon"><IconP name="mail" size={16} /></span>
        <span className="pd-contact__text">
          <span className="pd-contact__label">Email address</span>
          <span className="pd-contact__value">{email}</span>
        </span>
        <IconP name="arrow-up-right" size={16} className="pd-contact__go" />
      </a>
    </div>);
}

function MemberCard({ m, onView }) {
  return (
    <SectionCard title="Member information" desc="The member who requested this viewing.">
      <div className="vwd-person">
        <AvatarP name={m.name} size="xl" />
        <div className="vwd-person__id">
          <span className="vwd-person__name">{m.name}</span>
          <span className="vwd-person__sub">{m.id}</span>
          <div className="vwd-person__badges">
            <BadgeP variant={(VWD_ROLE_META[m.role] || {}).variant} size="sm">{m.role}</BadgeP>
          </div>
        </div>
        <ContactList phone={m.phone} email={m.email} />
        <a className="vwd-personlink" href={VWD_MEMBER_PROFILE} onClick={onView}>
          <IconP name="user" size={17} />
          View member
          <IconP name="arrow-right" size={17} className="vwd-personlink__arrow" />
        </a>
      </div>
    </SectionCard>);
}

function AgentCard({ a, onView }) {
  return (
    <SectionCard title="Assigned agent" desc="The agent hosting this viewing.">
      <div className="vwd-person">
        <AvatarP src={a.img} name={a.name} size="xl" verified />
        <div className="vwd-person__id">
          <span className="vwd-person__name">{a.name}</span>
          <span className="vwd-person__sub">{a.id}</span>
          <span className="vwd-agent__exp"><IconP name="award" size={13} />{a.experience} years experience</span>
        </div>
        <ContactList phone={a.phone} email={a.email} />
        <a className="vwd-personlink" href={VWD_AGENT_DETAILS} onClick={onView}>
          <IconP name="badge-check" size={17} />
          View agent
          <IconP name="arrow-right" size={17} className="vwd-personlink__arrow" />
        </a>
      </div>
    </SectionCard>);
}

/* ================================================================
   ACTIVITY TIMELINE
================================================================ */
const TL_TONE = {
  brand: "var(--green-700)", gold: "var(--gold-500)", success: "var(--success-600)",
  info: "var(--info-600)", error: "var(--error-600)", neutral: "var(--gray-500)"
};
function Timeline({ items }) {
  return (
    <ul className="pd-timeline">
      {items.map((it, i) =>
        <li className="pd-tl" key={i}>
          <span className="pd-tl__dot" style={{ background: TL_TONE[it.tone] }}><IconP name={it.icon} size={14} strokeWidth={2.2} /></span>
          <div className="pd-tl__body">
            <div className="pd-tl__top">
              <span className="pd-tl__title">{it.title}</span>
              <span className="pd-tl__time">{it.time}</span>
            </div>
            <p className="pd-tl__desc">{it.desc}</p>
            <span className="pd-tl__by"><IconP name="user-round" size={13} />by <b>{it.by}</b></span>
          </div>
        </li>)}
    </ul>);
}

/* ================================================================
   INTERNAL NOTES
================================================================ */
const NOTE_KIND = {
  approval: { icon: "check-circle", cls: "is-approval" },
  review: { icon: "shield-check", cls: "is-review" },
  note: { icon: "message-square", cls: "is-note" }
};
const NOTE_MAX = 500;

function NoteComposer({ spaced, initial, submitLabel, onSave, onCancel }) {
  const [draft, setDraft] = useStateP(initial || "");
  const text = draft.trim();
  const remaining = NOTE_MAX - draft.length;
  const save = () => { if (text) onSave(text); };
  const onKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); save(); }
  };
  return (
    <div className={"pd-notecomposer" + (spaced ? " is-spaced" : "")}>
      <TextareaP autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown}
        rows={3} maxLength={NOTE_MAX} aria-label="Internal note"
        placeholder="Add an admin-only note about this viewing — access arrangements, member preferences, reminders…" />
      <div className="pd-notecomposer__foot">
        <span className={"pd-notecomposer__hint" + (remaining <= 50 ? " is-low" : "")}>{remaining} characters left</span>
        <div className="pd-notecomposer__actions">
          <ButtonP hierarchy="ghost" size="sm" onClick={onCancel}>Cancel</ButtonP>
          <ButtonP hierarchy="primary" size="sm" disabled={!text} onClick={save}>{submitLabel || "Add note"}</ButtonP>
        </div>
      </div>
    </div>);
}

function NotesSection({ notes, onAdd, onEdit, onDelete }) {
  const [composing, setComposing] = useStateP(false);
  const [editing, setEditing] = useStateP(null);
  const handleSave = (text) => { onAdd(text); setComposing(false); };
  return (
    <SectionCard title="Internal notes" count={notes.length}
      desc="Admin-only remarks. Never visible to the member or the agent."
      action={!composing && editing == null && <ButtonP hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setComposing(true)}>Add note</ButtonP>}>
      {composing && <NoteComposer spaced={notes.length > 0} onSave={handleSave} onCancel={() => setComposing(false)} />}
      {notes.length === 0
        ? (!composing &&
          <div className="pd-noagent">
            <span className="pd-noagent__art"><IconP name="sticky-note" size={24} strokeWidth={1.6} /></span>
            <p>No internal notes yet. Add an admin-only note to track access details, member preferences, or reminders for this viewing.</p>
          </div>)
        : <div className="pd-notes">
            {notes.map((n, i) => {
              const k = NOTE_KIND[n.kind] || NOTE_KIND.note;
              if (editing === i) {
                return (
                  <div className={"pd-noteitem " + k.cls} key={i}>
                    <NoteComposer initial={n.text} submitLabel="Save note"
                      onSave={(text) => { onEdit(i, text); setEditing(null); }}
                      onCancel={() => setEditing(null)} />
                  </div>);
              }
              return (
                <div className={"pd-noteitem " + k.cls} key={i}>
                  <div className="pd-note__head">
                    <span className="pd-note__label">{VWD_adNoteRoleLabel(n.role)}</span>
                    <div style={{ display: "flex", gap: 2 }}>
                      <button type="button" className="pd-note__delete" aria-label="Edit note" title="Edit note" onClick={() => { setComposing(false); setEditing(i); }}>
                        <IconP name="pencil" size={14} />
                      </button>
                      <button type="button" className="pd-note__delete" aria-label="Delete note" title="Delete note" onClick={() => onDelete && onDelete(i)}>
                        <IconP name="trash-2" size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="pd-note">
                    <div className="pd-note__body">
                      <p className="pd-note__text">{n.text}</p>
                      <span className="pd-note__time">{n.author} · {n.time}</span>
                    </div>
                  </div>
                </div>);
            })}
          </div>}
    </SectionCard>);
}

/* ================================================================
   APP
================================================================ */
function App() {
  const v = VWD_VIEWING;
  const [collapsed, setCollapsed] = useStateP(() => window.innerWidth >= 768);
  const [drawerOpen, setDrawerOpen] = useStateP(false);
  const [openMenu, setOpenMenu] = useStateP(null);
  const [moreOpen, setMoreOpen] = useStateP(false);

  const [status, setStatus] = useStateP(v.status);
  const [modal, setModal] = useStateP(null); // 'complete' | 'cancel' | 'delete'
  const [notes, setNotes] = useStateP(VWD_INIT_NOTES);
  const [noteToDelete, setNoteToDelete] = useStateP(null);

  const [toasts, pushToast, dismissToast] = VWD_useToasts();
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
  const navSelect = (id) => { setDrawerOpen(false); go(VWD_PAGE_MAP[id]); };
  const editViewing = () => pushToast({ tone: "brand", icon: "pencil", title: "Edit viewing", msg: "Opening the editor for " + v.id + "." });

  const closed = status === "Completed" || status === "Cancelled";

  return (
    <div className={"ax-app" + (collapsed ? " is-collapsed" : "")}>
      <VWD_Sidebar collapsed={collapsed} drawerOpen={drawerOpen} active="viewings"
        onSelect={navSelect} onToggleCollapse={() => setCollapsed((x) => !x)} />
      {drawerOpen && <div className="ax-scrim" onClick={() => setDrawerOpen(false)} />}

      <div className="ax-main">
        <VWD_Topbar openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />

        <main className="ax-content" data-screen-label="Admin · Viewing Details">
          {/* ---------- HEADER ---------- */}
          <header className="pd-head">
            <nav className="pd-breadcrumb" aria-label="Breadcrumb">
              <a href={VWD_PAGE_MAP.dashboard}>Dashboard</a>
              <IconP name="chevron-right" size={14} />
              <a href={VWD_PAGE_MAP.viewings}>Viewings</a>
              <IconP name="chevron-right" size={14} />
              <span aria-current="page">{v.id}</span>
            </nav>

            <div className="pd-head__main">
              <div className="pd-head__intro">
                <div className="pd-head__titlerow">
                  <h1 className="pd-head__title">{v.id}</h1>
                  <StatusBadge status={status} size="md" />
                </div>
                <div className="pd-head__meta">
                  <span className="pd-head__metaitem pd-head__metaitem--accent"><IconP name="calendar" size={14} />{v.dateLong}</span>
                  <span className="pd-head__sep" />
                  <span className="pd-head__metaitem pd-head__metaitem--accent"><IconP name="clock" size={14} />{v.time} – {v.endTime}</span>
                  <span className="pd-head__sep" />
                  <span className="pd-head__metaitem"><IconP name="hourglass" size={14} />{v.duration}</span>
                </div>
              </div>

              <div className="pd-head__actions">
                <ButtonP hierarchy="secondary" size="md" iconLeading="refresh-cw" onClick={() => { setMoreOpen(false); setModal("status"); }}>Change status</ButtonP>
                <ButtonP hierarchy="primary" size="md" iconLeading="pencil" onClick={editViewing}>Edit viewing</ButtonP>
                <div className="pd-morewrap" ref={moreRef}>
                  <button type="button" className={"pd-morebtn" + (moreOpen ? " is-open" : "")} aria-label="More actions" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen((x) => !x)}>
                    <IconP name="ellipsis" size={20} />
                  </button>
                  {moreOpen &&
                    <div className="pd-moremenu" role="menu">
                      <button type="button" className="pd-moreitem" role="menuitem" onClick={() => { setMoreOpen(false); editViewing(); }}><IconP name="calendar-range" size={17} />Reschedule</button>
                      <button type="button" className="pd-moreitem" role="menuitem" onClick={() => { setMoreOpen(false); pushToast({ tone: "default", icon: "send", title: "Reminder sent", msg: "A reminder was sent to " + v.member.name + "." }); }}><IconP name="bell" size={17} />Send reminder</button>
                      <button type="button" className="pd-moreitem" role="menuitem" onClick={() => { setMoreOpen(false); setModal("cancel"); }} disabled={closed}><IconP name="x-circle" size={17} />Cancel viewing</button>
                      <div className="pd-moremenu__sep" />
                      <button type="button" className="pd-moreitem pd-moreitem--danger" role="menuitem" onClick={() => { setMoreOpen(false); setModal("delete"); }}><IconP name="trash-2" size={17} />Delete viewing</button>
                    </div>}
                </div>
              </div>
            </div>
          </header>

          {/* ---------- TWO-COLUMN GRID ---------- */}
          <div className="pd-grid">
            <div className="pd-grid__main">
              <PropertyInfo p={v.property} onView={() => go(VWD_PROPERTY_DETAILS)} />
              <Overview v={v} status={status} />
              <SectionCard title="Timeline" desc="Chronological history of this viewing.">
                <Timeline items={VWD_TIMELINE} />
              </SectionCard>
              <NotesSection notes={notes}
                onAdd={(text) => {
                  setNotes((ns) => [{ author: "Rêbîn Kawa", role: "Super Admin", time: "Just now", kind: "note", text }, ...ns]);
                  pushToast({ tone: "brand", icon: "check", title: "Note added", msg: "Your internal note was saved to this viewing." });
                }}
                onEdit={(i, text) => {
                  setNotes((ns) => ns.map((n, idx) => idx === i ? { ...n, text, time: "Edited just now" } : n));
                  pushToast({ tone: "brand", icon: "pencil", title: "Note updated", msg: "Your changes to the internal note were saved." });
                }}
                onDelete={(i) => setNoteToDelete(i)} />
            </div>

            <aside className="pd-grid__aside">
              <MemberCard m={v.member} onView={() => {}} />
              <AgentCard a={v.agent} onView={() => {}} />
            </aside>
          </div>

        </main>
      </div>

      {/* MODALS */}
      {modal === "status" &&
        <VWD_ViewingStatusModal current={status}
          onCancel={() => setModal(null)}
          onConfirm={(next) => {
            setStatus(next);
            setModal(null);
            const meta = VWD_VIEW_STATUS_META[next] || {};
            const danger = next === "Cancelled" || next === "No Show";
            pushToast({
              tone: danger ? "danger" : "brand",
              icon: meta.icon || "refresh-cw",
              title: "Status updated",
              msg: v.id + " is now marked as " + next + "."
            });
          }} />}
      {modal === "complete" &&
        <VWD_ConfirmModal icon="check-check" title="Mark viewing as completed?"
          body={<React.Fragment>Confirm that the viewing of <strong>{v.property.name}</strong> with <strong>{v.member.name}</strong> took place. This updates the status to Completed and logs the event in the timeline.</React.Fragment>}
          confirmLabel="Mark completed" confirmIcon="check-check" tone="brand"
          onCancel={() => setModal(null)}
          onConfirm={() => { setStatus("Completed"); setModal(null); pushToast({ tone: "brand", icon: "check-circle", title: "Viewing completed", msg: v.id + " was marked as completed." }); }} />}
      {modal === "cancel" &&
        <VWD_ConfirmModal icon="x-circle" title="Cancel this viewing?"
          body={<React.Fragment>This will cancel the viewing of <strong>{v.property.name}</strong> scheduled for <strong>{v.date}, {v.time}</strong>. The member and agent will be notified.</React.Fragment>}
          confirmLabel="Cancel viewing" confirmIcon="x-circle" tone="danger"
          onCancel={() => setModal(null)}
          onConfirm={() => { setStatus("Cancelled"); setModal(null); pushToast({ tone: "danger", icon: "x-circle", title: "Viewing cancelled", msg: v.id + " has been cancelled." }); }} />}
      {modal === "delete" &&
        <VWD_ConfirmModal icon="trash-2" title="Delete viewing?"
          body={<React.Fragment>Are you sure you want to delete <strong>{v.id}</strong>? This action cannot be undone and will permanently remove the appointment and its history.</React.Fragment>}
          confirmLabel="Delete viewing" confirmIcon="trash-2" tone="danger"
          onCancel={() => setModal(null)}
          onConfirm={() => { setModal(null); pushToast({ tone: "danger", icon: "trash-2", title: "Viewing deleted", msg: v.id + " has been removed. Returning to Viewings…" }); setTimeout(() => go(VWD_PAGE_MAP.viewings), 1400); }} />}
      {noteToDelete != null && notes[noteToDelete] &&
        <VWD_DeleteNoteModal note={notes[noteToDelete]} onCancel={() => setNoteToDelete(null)}
          onConfirm={() => {
            const removed = notes[noteToDelete];
            setNotes((ns) => ns.filter((_, i) => i !== noteToDelete));
            setNoteToDelete(null);
            pushToast({ tone: "danger", icon: "trash-2", title: "Note deleted", msg: "The internal note from " + removed.author + " was removed." });
          }} />}

      {/* TOASTS */}
      <div className="pp-toaster" aria-live="polite">
        {toasts.map((t) => <VWD_ProfToast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />)}
      </div>
    </div>);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
