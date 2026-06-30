/* ==================================================================
   AGENT DETAILS — PAGE
   Header + profile hero + performance + listings/members/viewings/
   reviews + activity timeline. Wired to core data/modals/toast.
================================================================== */
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;
const DSP = window.ChiyaEstateDesignSystem_686f57;
const { Icon: IconP, Button: ButtonP, Avatar: AvatarP, Badge: BadgeP, StatCard, Textarea: TextareaP } = DSP;

/* ================================================================
   INTERNAL NOTES — data + components (ported from Member Profile)
================================================================ */
const AD_INIT_NOTES = [
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 18, 2026 · 11:24", kind: "review",
    text: "Top-performing senior consultant with a strong sale and rental pipeline across Erbil. Licence and ID documents verified and on file. Cleared for premium listings and high-value clients." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "May 30, 2026 · 16:10", kind: "note",
    text: "Closed the Naz City Penthouse sale ahead of schedule. Consistently responsive and keeps members updated. Consider for the featured-agent program next quarter." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Mar 14, 2023 · 09:05", kind: "approval",
    text: "Agent profile approved and verified. Assigned to the Chiya Prime team as a Senior Property Consultant." }];

const AD_NOTE_KIND = {
  approval: { icon: "check-circle", cls: "is-approval" },
  review: { icon: "shield-check", cls: "is-review" },
  note: { icon: "message-square", cls: "is-note" }
};
const AD_NOTE_MAX = 500;
function adNoteRoleLabel(role) {
  const r = (role || "").trim();
  if (!r) return "Note";
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() + " note";
}
function NoteComposer({ spaced, onSave, onCancel }) {
  const [draft, setDraft] = useStateP("");
  const text = draft.trim();
  const remaining = AD_NOTE_MAX - draft.length;
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
        maxLength={AD_NOTE_MAX}
        aria-label="New internal note"
        placeholder="Add a note about verification, performance, or reminders for this agent…" />
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
    <SectionCard icon="sticky-note" title="Internal notes" count={notes.length}
      desc="Admin-only remarks and history. Never visible to the agent."
      action={!composing && <ButtonP hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setComposing(true)}>Add note</ButtonP>}>
      {composing && <NoteComposer spaced={notes.length > 0} onSave={handleSave} onCancel={() => setComposing(false)} />}
      {notes.length === 0 ?
      (!composing &&
      <div className="pd-noagent">
        <span className="pd-noagent__art"><IconP name="sticky-note" size={24} strokeWidth={1.6} /></span>
        <p>No internal notes yet. Add an admin-only note to track verification, performance, or reminders for this agent.</p>
      </div>) :
      <div className="pd-notes">
        {notes.map((n, i) => {
          const k = AD_NOTE_KIND[n.kind] || AD_NOTE_KIND.note;
          return (
            <div className={"pd-noteitem " + k.cls} key={i}>
              <div className="pd-note__head">
                <span className="pd-note__label">{adNoteRoleLabel(n.role)}</span>
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
function AD_DeleteNoteModal({ note, onCancel, onConfirm }) {
  useEffectP(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const label = adNoteRoleLabel(note.role).toLowerCase();
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="ad-delnote-title">
        <div className="pp-modal__icon">
          <IconP name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="ad-delnote-title">Delete note?</h2>
        <p className="pp-modal__body">
          Are you sure you want to delete this <strong>{label}</strong>? This action cannot be undone and will permanently remove it from this agent.
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}><IconP name="trash-2" size={15} />Delete note</button>
        </div>
      </div>
    </div>,
    document.body);
}

const {
  AD_NAV_FLAT, AD_PAGE_MAP, AD_PROPERTY_DETAILS, AD_MEMBER_PROFILE, AD_PUBLIC_PROFILE,
  AD_AGENT, AD_KPIS, AD_LISTINGS, AD_MEMBERS, AD_VIEWINGS,
  AD_RATING_BARS, AD_REVIEWS, AD_TIMELINE,
  AD_ROLE_META, AD_LISTING_STATUS_META, AD_LISTING_TYPE_META, AD_MEMBER_STATUS_META, AD_VIEW_STATUS_META,
  AD_Sidebar, AD_Topbar, AD_ChangeStatusModal, AD_DeleteAgentModal,
  AD_ProfToast, AD_useToasts
} = window;

/* helper: status badge with optional leading dot */
function StatusBadge({ value, meta }) {
  const m = (meta && meta[value]) || { variant: "neutral" };
  return <BadgeP variant={m.variant} size="sm" icon={m.icon} dot={m.dot}>{value}</BadgeP>;
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

function PriceCell({ price, per }) {
  return <span className="mpf-price">{price}{per && <span className="mpf-price__per">{per}</span>}</span>;
}
function PropCell({ row }) {
  return (
    <div className="mpf-prop">
      <img className="mpf-prop__thumb" src={row.img} alt="" loading="lazy" />
      <div className="mpf-prop__body">
        <div className="mpf-prop__title">{row.title}</div>
        <div className="mpf-prop__sub mpf-prop__sub--mono">{row.id}</div>
      </div>
    </div>);
}

/* ================================================================
   PROFILE HERO
================================================================ */
function ProfileHero({ agent, status, onEdit, pushToast }) {
  const verified = agent.verification === "Verified";
  const statusVariant = status === "Active" ? "success" : "error";
  const copy = (label, text) => {
    try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) {}
    pushToast({ tone: "default", icon: "copy", title: label + " copied", msg: text });
  };
  return (
    <div className="adh">
      <div className="pd-card__head" style={{ margin: "-26px -26px 0", padding: "18px 22px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="pd-card__heading">
          <div className="pd-card__titles">
            <h2 className="pd-card__title">Basic informations</h2>
            <p className="pd-card__desc">Identity, contact details and verification for this agent.</p>
          </div>
        </div>
      </div>
      <div className="adh__body">
        <div className="adh__details adh__details--top">
          <div className="adh__detail">
            <span className="adh__detail__icon"><IconP name="phone" size={17} /></span>
            <div className="adh__detail__text">
              <span className="adh__detail__label">Phone number</span>
              <span className="adh__detail__value">
                <span>{agent.phone}</span>
                <button type="button" className="adh__copy" title="Copy phone number" aria-label="Copy phone number" onClick={() => copy("Phone number", agent.phone)}><IconP name="copy" size={13} /></button>
              </span>
            </div>
          </div>

          <div className="adh__detail">
            <span className="adh__detail__icon"><IconP name="map-pin" size={17} /></span>
            <div className="adh__detail__text">
              <span className="adh__detail__label">Service areas</span>
              <div className="adh__detailchips">
                {agent.areas.map((a) => <span className="adh__chip" key={a}>{a}</span>)}
              </div>
            </div>
          </div>

          <div className="adh__detail">
            <span className="adh__detail__icon"><IconP name="mail" size={17} /></span>
            <div className="adh__detail__text">
              <span className="adh__detail__label">Email address</span>
              <span className="adh__detail__value">
                <span>{agent.email}</span>
                <button type="button" className="adh__copy" title="Copy email address" aria-label="Copy email address" onClick={() => copy("Email address", agent.email)}><IconP name="copy" size={13} /></button>
              </span>
            </div>
          </div>

          <div className="adh__detail">
            <span className="adh__detail__icon"><IconP name="languages" size={17} /></span>
            <div className="adh__detail__text">
              <span className="adh__detail__label">Languages</span>
              <div className="adh__detailchips">
                {agent.languages.map((l) => <span className="adh__chip" key={l}>{l}</span>)}
              </div>
            </div>
          </div>

          <div className="adh__detail">
            <span className="adh__detail__icon"><IconP name="award" size={17} /></span>
            <div className="adh__detail__text">
              <span className="adh__detail__label">Experience</span>
              <span className="adh__detail__value"><span>{agent.experience} years</span></span>
            </div>
          </div>

          <div className="adh__detail">
            <span className="adh__detail__icon"><IconP name="calendar" size={17} /></span>
            <div className="adh__detail__text">
              <span className="adh__detail__label">Date added</span>
              <span className="adh__detail__value"><span>{agent.joinedFull}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>);
}

/* ================================================================
   ASSIGNED LISTINGS
================================================================ */
function ListingsTable({ rows }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--listings">
        <div className="mpf-thead">
          <span className="mpf-th">Property</span>
          <span className="mpf-th">Location</span>
          <span className="mpf-th">Listing type</span>
          <span className="mpf-th">Status</span>
          <span className="mpf-th">Price</span>
          <span className="mpf-th">Date added</span>
          <span className="mpf-th mpf-th--end">Action</span>
        </div>
        {rows.map((row) =>
          <div className="mpf-trow" key={row.id}>
            <PropCell row={row} />
            <div className="mpf-cell">
              <span className="mpf-cell__label">Location</span>
              <span className="mpf-prop__sub"><IconP name="map-pin" size={12} />{row.loc}</span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Listing type</span>
              <BadgeP variant={(AD_LISTING_TYPE_META[row.type] || {}).variant} size="sm">{row.type}</BadgeP>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Status</span>
              <StatusBadge value={row.status} meta={AD_LISTING_STATUS_META} />
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Price</span>
              <PriceCell price={row.price} per={row.per} />
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Date added</span>
              <span className="mpf-date">{row.date}</span>
            </div>
            <div className="mpf-cell mpf-cell--end mpf-cell--action">
              <a className="mpf-viewbtn" href={AD_PROPERTY_DETAILS} title="View property" aria-label={"View " + row.title}>
                <IconP name="arrow-up-right" size={17} />
              </a>
            </div>
          </div>)}
      </div>
    </div>);
}

/* ================================================================
   ASSIGNED MEMBERS
================================================================ */
function MembersTable({ rows }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--amembers">
        <div className="mpf-thead">
          <span className="mpf-th">Member</span>
          <span className="mpf-th">Phone</span>
          <span className="mpf-th">Role tags</span>
          <span className="mpf-th">Status</span>
          <span className="mpf-th">Last activity</span>
          <span className="mpf-th mpf-th--end">Action</span>
        </div>
        {rows.map((row) =>
          <div className="mpf-trow" key={row.id}>
            <div className="mpf-person">
              <AvatarP src={row.img} name={row.name} size="md" />
              <div className="mpf-person__body">
                <span className="mpf-person__name">{row.name}</span>
                <span className="mpf-person__id">{row.id}</span>
              </div>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Phone</span>
              <span className="mpf-date" style={{ fontWeight: 600, color: "var(--text-primary)" }}>{row.phone}</span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Role tags</span>
              <span className="mpf-roletags">
                {row.roles.map((r) => <BadgeP key={r} variant={(AD_ROLE_META[r] || {}).variant} size="sm">{r}</BadgeP>)}
              </span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Status</span>
              <StatusBadge value={row.status} meta={AD_MEMBER_STATUS_META} />
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Last activity</span>
              <span className="mpf-date">{row.activity}</span>
            </div>
            <div className="mpf-cell mpf-cell--end mpf-cell--action">
              <a className="mpf-viewbtn" href={AD_MEMBER_PROFILE} title="View member" aria-label={"View " + row.name}>
                <IconP name="arrow-up-right" size={17} />
              </a>
            </div>
          </div>)}
      </div>
    </div>);
}

/* ================================================================
   VIEWINGS
================================================================ */
function ViewingsTable({ rows }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--aviewings">
        <div className="mpf-thead">
          <span className="mpf-th">Property</span>
          <span className="mpf-th">Member</span>
          <span className="mpf-th">Date &amp; time</span>
          <span className="mpf-th">Status</span>
        </div>
        {rows.map((row, i) =>
          <div className="mpf-trow" key={row.id + i}>
            <div className="mpf-prop">
              <img className="mpf-prop__thumb" src={row.img} alt="" loading="lazy" />
              <div className="mpf-prop__body">
                <div className="mpf-prop__title">{row.title}</div>
                <div className="mpf-prop__sub"><IconP name="map-pin" size={12} />{row.loc}</div>
              </div>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Member</span>
              <span className="mpf-memcell">
                <AvatarP src={row.memberImg} name={row.member} size="xs" />
                <span className="mpf-memcell__name">{row.member}</span>
              </span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Date &amp; time</span>
              <span className="mpf-date">{row.when}</span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Status</span>
              <StatusBadge value={row.status} meta={AD_VIEW_STATUS_META} />
            </div>
          </div>)}
      </div>
    </div>);
}

/* ================================================================
   REVIEWS
================================================================ */
function Stars({ n, size }) {
  return (
    <span className="adr-card__stars">
      {[1, 2, 3, 4, 5].map((i) =>
        <IconP key={i} name="star" size={size || 15} strokeWidth={1.6}
          style={{ color: i <= n ? "var(--brand-accent)" : "var(--gray-300)", fill: i <= n ? "var(--brand-accent)" : "transparent" }} />)}
    </span>);
}

function Reviews({ agent, bars, reviews }) {
  return (
    <div className="adr">
      <div className="adr__summary">
        <div className="adr__big">{agent.rating}</div>
        <span className="adr__stars">
          {[1, 2, 3, 4, 5].map((i) =>
            <IconP key={i} name="star" size={17} strokeWidth={1.6}
              className={i <= Math.round(agent.rating) ? "" : "is-off"}
              style={{ fill: i <= Math.round(agent.rating) ? "var(--brand-accent)" : "transparent" }} />)}
        </span>
        <div className="adr__count">Based on {agent.reviews} reviews</div>
        <div className="adr__bars">
          {bars.map((b) =>
            <div className="adr__barrow" key={b.star}>
              <span className="adr__barlbl">{b.star}<IconP name="star" size={11} style={{ fill: "var(--brand-accent)" }} /></span>
              <span className="adr__bartrack"><span className="adr__barfill" style={{ width: b.pct + "%" }} /></span>
              <span className="adr__barpct">{b.pct}%</span>
            </div>)}
        </div>
      </div>
      <div className="adr__list">
        {reviews.map((r, i) =>
          <article className="adr-card" key={i}>
            <div className="adr-card__head">
              <AvatarP name={r.name} size="md" />
              <div className="adr-card__id">
                <div className="adr-card__name">{r.name}</div>
                <div className="adr-card__deal">{r.deal}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Stars n={r.stars} size={14} />
                <div className="adr-card__when">{r.when}</div>
              </div>
            </div>
            <p className="adr-card__text">“{r.text}”</p>
          </article>)}
      </div>
    </div>);
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
          </div>
        </li>)}
    </ul>);
}

/* ================================================================
   APP
================================================================ */
function App() {
  const a = AD_AGENT;
  const [collapsed, setCollapsed] = useStateP(() => window.innerWidth >= 768);
  const [drawerOpen, setDrawerOpen] = useStateP(false);
  const [openMenu, setOpenMenu] = useStateP(null);
  const [moreOpen, setMoreOpen] = useStateP(false);

  const [status, setStatus] = useStateP(a.status);
  const [modal, setModal] = useStateP(null); // 'status' | 'delete'
  const [notes, setNotes] = useStateP(AD_INIT_NOTES);
  const [noteToDelete, setNoteToDelete] = useStateP(null);

  const [toasts, pushToast, dismissToast] = AD_useToasts();
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
  const navSelect = (id) => { setDrawerOpen(false); go(AD_PAGE_MAP[id]); };
  const editAgent = () => pushToast({ tone: "brand", icon: "pencil", title: "Edit agent", msg: "Opening the editor for " + a.name + "." });

  const statusVariant = status === "Active" ? "success" : "error";

  return (
    <div className={"ax-app" + (collapsed ? " is-collapsed" : "")}>
      <AD_Sidebar collapsed={collapsed} drawerOpen={drawerOpen} active="agents"
        onSelect={navSelect} onToggleCollapse={() => setCollapsed((v) => !v)} />
      {drawerOpen && <div className="ax-scrim" onClick={() => setDrawerOpen(false)} />}

      <div className="ax-main">
        <AD_Topbar openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />

        <main className="ax-content" data-screen-label="Admin · Agent Details">
          {/* ---------- HEADER ---------- */}
          <header className="pd-head">
            <nav className="pd-breadcrumb" aria-label="Breadcrumb">
              <a href={AD_PAGE_MAP.dashboard}>Dashboard</a>
              <IconP name="chevron-right" size={14} />
              <a href={AD_PAGE_MAP.agents}>Agents</a>
              <IconP name="chevron-right" size={14} />
              <span aria-current="page">{a.name}</span>
            </nav>

            <div className="pd-head__main">
              <div className="pd-head__lead">
                <AvatarP src={a.img} name={a.name} size="xl" verified />
                <div className="pd-head__intro">
                <div className="pd-head__titlerow">
                  <h1 className="pd-head__title">{a.name}</h1>
                  <BadgeP variant={statusVariant} dot>{status}</BadgeP>
                  <BadgeP variant={a.verification === "Verified" ? "brand" : "warning"} icon={a.verification === "Verified" ? "badge-check" : "clock"}>{a.verification}</BadgeP>
                </div>
                <div className="pd-head__meta">
                  <span className="pd-head__metaitem pd-head__metaitem--id"><IconP name="hash" size={13} />{a.id}</span>
                  <span className="pd-head__sep" />
                  <span className="pd-head__metaitem"><IconP name="briefcase" size={14} />{a.title}</span>
                </div>
              </div>
              </div>

              <div className="pd-head__actions">
                <ButtonP hierarchy="secondary" iconLeading="pencil" onClick={editAgent}>Edit agent</ButtonP>
                <ButtonP hierarchy="primary" iconLeading="refresh-cw" onClick={() => { setMoreOpen(false); setModal("status"); }}>Change status</ButtonP>
                <div className="pd-morewrap" ref={moreRef}>
                  <button type="button" className={"pd-morebtn" + (moreOpen ? " is-open" : "")} aria-label="More actions" aria-haspopup="true" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
                    <IconP name="ellipsis" size={20} />
                  </button>
                  {moreOpen &&
                    <div className="pd-moremenu" role="menu">
                      <a className="pd-moreitem" role="menuitem" href={AD_PUBLIC_PROFILE} target="_blank" rel="noopener" onClick={() => setMoreOpen(false)}><IconP name="external-link" size={17} />View public profile</a>
                      <button type="button" className="pd-moreitem" role="menuitem" onClick={() => { setMoreOpen(false); pushToast({ tone: "brand", icon: "badge-check", title: "Verification", msg: "Opening verification review for " + a.name + "." }); }}><IconP name="shield-check" size={17} />Manage verification</button>
                      <button type="button" className="pd-moreitem" role="menuitem" onClick={() => { setMoreOpen(false); pushToast({ tone: "default", icon: "download", title: "Export started", msg: "Preparing a performance summary for " + a.name + "." }); }}><IconP name="download" size={17} />Export summary</button>
                      <div className="pd-moremenu__sep" />
                      <button type="button" className="pd-moreitem pd-moreitem--danger" role="menuitem" onClick={() => { setMoreOpen(false); setModal("delete"); }}><IconP name="trash-2" size={17} />Delete agent</button>
                    </div>}
                </div>
              </div>
            </div>
          </header>

          {/* ---------- PROFILE HERO ---------- */}
          <section className="pd-card" style={{ marginBottom: 22 }}>
            <ProfileHero agent={a} status={status} onEdit={editAgent} pushToast={pushToast} />
          </section>

          {/* ---------- PERFORMANCE SUMMARY ---------- */}
          <SectionCard icon="bar-chart-3" title="Performance summary"
            desc="Listing, transaction, and conversion metrics for this agent.">
            <div className="adk">
              {AD_KPIS.map((k) =>
                <StatCard key={k.key} label={k.label} value={k.value} icon={k.icon} tone={k.tone} sub={k.sub} />)}
            </div>
          </SectionCard>

          <div style={{ height: 22 }} />

          {/* ---------- SECTIONS ---------- */}
          <div className="pd-grid__main">
              {/* ASSIGNED LISTINGS */}
              <SectionCard icon="building-2" title="Assigned listings" count={AD_LISTINGS.length}
                desc="Properties currently managed by this agent."
                action={<ButtonP hierarchy="secondary" size="sm" iconTrailing="arrow-right" href={AD_PAGE_MAP.properties}>All properties</ButtonP>}
                flush>
                <ListingsTable rows={AD_LISTINGS} />
              </SectionCard>

              {/* ASSIGNED MEMBERS */}
              <SectionCard icon="users" title="Assigned members" count={AD_MEMBERS.length}
                desc="Clients this agent manages across buying, selling, and renting."
                action={<ButtonP hierarchy="secondary" size="sm" iconTrailing="arrow-right" onClick={() => go(AD_PAGE_MAP.members)}>All members</ButtonP>}
                flush>
                <MembersTable rows={AD_MEMBERS} />
              </SectionCard>

              {/* VIEWINGS */}
              <SectionCard icon="calendar-check" title="Viewings" count={AD_VIEWINGS.length}
                desc="Scheduled and completed property viewings hosted by this agent." flush>
                <ViewingsTable rows={AD_VIEWINGS} />
              </SectionCard>

              {/* REVIEWS */}
              <SectionCard icon="star" iconTone="gold" title="Reviews" count={a.reviews}
                desc="Feedback from members this agent has worked with.">
                <Reviews agent={a} bars={AD_RATING_BARS} reviews={AD_REVIEWS} />
              </SectionCard>

              {/* INTERNAL NOTES */}
              <NotesSection notes={notes}
                onAdd={(text) => {
                  setNotes((ns) => [{ author: "Rêbîn Kawa", role: "Super Admin", time: "Just now", kind: "note", text }, ...ns]);
                  pushToast({ tone: "brand", icon: "check", title: "Note added", msg: "Your internal note was saved to this agent." });
                }}
                onDelete={(i) => setNoteToDelete(i)} />

              {/* ACTIVITY TIMELINE */}
              <SectionCard icon="history" title="Activity timeline" desc="Chronological admin history for this agent.">
                <Timeline items={AD_TIMELINE} />
              </SectionCard>
          </div>
        </main>
      </div>

      {/* MODALS */}
      {modal === "status" &&
        <AD_ChangeStatusModal current={status} onCancel={() => setModal(null)}
          onConfirm={(s) => { setStatus(s); setModal(null); pushToast({ tone: s === "Suspended" ? "danger" : "brand", icon: s === "Suspended" ? "pause-circle" : "check-circle", title: "Status updated", msg: a.name + " is now " + s + "." }); }} />}
      {modal === "delete" &&
        <AD_DeleteAgentModal agent={a} onCancel={() => setModal(null)}
          onConfirm={() => { setModal(null); pushToast({ tone: "danger", icon: "trash-2", title: "Agent deleted", msg: a.name + " has been removed from Chiya Estate." }); }} />}
      {noteToDelete != null && notes[noteToDelete] &&
        <AD_DeleteNoteModal note={notes[noteToDelete]} onCancel={() => setNoteToDelete(null)}
          onConfirm={() => {
            const removed = notes[noteToDelete];
            setNotes((ns) => ns.filter((_, i) => i !== noteToDelete));
            setNoteToDelete(null);
            pushToast({ tone: "danger", icon: "trash-2", title: "Note deleted", msg: "The internal note from " + removed.author + " was removed." });
          }} />}

      {/* TOASTS */}
      <div className="pp-toaster" aria-live="polite">
        {toasts.map((t) => <AD_ProfToast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />)}
      </div>
    </div>);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
