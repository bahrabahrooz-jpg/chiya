/* ==================================================================
   PROPERTY DETAILS — PAGE
   Header (title, meta, quick actions) + 7 detail sections.
   Consumes shell, data, modals & toast from pd-core.jsx (on window).
================================================================== */
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP, useCallback: useCallbackP } = React;
const PDS = window.PD_DS;
const { Icon, Button, Avatar, Badge, Textarea } = PDS;
const ADMIN = window.PD_ADMIN;

const Sidebar = window.Sidebar;
const Topbar = window.Topbar;
const ChangeStatusModal = window.ChangeStatusModal;
const AssignAgentModal = window.AssignAgentModal;
const ConfirmModal = window.ConfirmModal;
const PropToast = window.PropToast;
const useToasts = window.useToasts;
const STATUS_META = window.PD_STATUS_META;
const fmtUSD = window.PD_fmtUSD;
const getProperty = window.PD_getProperty;
const PAGE_MAP = window.PD_PAGE_MAP;
const NAV_FLAT = window.PD_NAV_FLAT;
const VIEWING_STATUS = window.PD_VIEWING_STATUS;
const getViewings = window.PD_getViewings;

function qid() {
  const m = new URLSearchParams(window.location.search).get("id");
  return m || "CH-2041";
}

/* Timestamp in the same format the seeded notes use: "Jun 23, 2026 · 14:30" */
function nowStamp() {
  const d = new Date();
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p2 = (n) => String(n).padStart(2, "0");
  return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} \u00b7 ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/* ------------------------------------------------------------------
   Small building blocks
------------------------------------------------------------------ */
function SectionCard({ icon, title, desc, action, children, id, flush }) {
  return (
    <section className="pd-card" id={id}>
      <header className="pd-card__head">
        <div className="pd-card__heading">
          <div className="pd-card__titles">
            <h2 className="pd-card__title">{title}</h2>
            {desc && <p className="pd-card__desc">{desc}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className={"pd-card__body" + (flush ? " pd-card__body--flush" : "")}>{children}</div>
    </section>);
}

/* A single definition-list row: small icon · label · value */
function Field({ icon, label, value, mono, em }) {
  return (
    <div className={"pd-field" + (em ? " pd-field--em" : "")}>
      <span className="pd-field__icon"><Icon name={icon} size={15} /></span>
      <div className="pd-field__text">
        <span className="pd-field__label">{label}</span>
        <span className={"pd-field__value" + (mono ? " pd-field__value--mono" : "")}>{value}</span>
      </div>
    </div>);
}

/* A titled section grouping a two-column definition list */
function DGroup({ title, desc, children, cols, noRowDivider }) {
  return (
    <section className="pd-dgroup">
      <header className="pd-dgroup__head">
        <h3 className="pd-dgroup__title">{title}</h3>
        {desc && <p className="pd-dgroup__desc">{desc}</p>}
      </header>
      <div className={"pd-dl" + (cols === 1 ? " pd-dl--one" : "") + (noRowDivider ? " pd-dl--no-divider" : "")}>{children}</div>
    </section>);
}

/* ------------------------------------------------------------------
   HEADER — title, meta chips, quick actions
------------------------------------------------------------------ */
function DetailHeader({ p, onEdit, onChangeStatus, onAssignAgent, onArchive, onDelete }) {
  const [menuOpen, setMenuOpen] = useStateP(false);
  const menuRef = useRefP(null);
  useEffectP(() => {
    if (!menuOpen) return;
    const close = (e) => {if (!menuRef.current?.contains(e.target)) setMenuOpen(false);};
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const st = STATUS_META[p.status] || { variant: "neutral" };
  return (
    <header className="pd-head">
      <nav className="pd-breadcrumb" aria-label="Breadcrumb">
        <a href={PAGE_MAP.properties}>Properties</a>
        <Icon name="chevron-right" size={14} />
        <span aria-current="page">{p.title}</span>
      </nav>

      <div className="pd-head__main">
        <div className="pd-head__intro">
          <div className="pd-head__titlerow">
            <h1 className="pd-head__title">{p.title}</h1>
            <Badge variant={st.variant} size="md" dot={st.dot} icon={st.icon}>{p.status}</Badge>
          </div>
          <div className="pd-head__meta">
            <span className="pd-head__metaitem pd-head__metaitem--id"><Icon name="hash" size={14} />{p.id}</span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem"><Icon name="building-2" size={14} />{p.type}</span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem">
              <Icon name={p.listing === "sale" ? "tag" : "key"} size={14} />
              {p.listing === "sale" ? "For sale" : "For rent"}
            </span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem"><Icon name="map-pin" size={14} />{p.location}</span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem"><Icon name="calendar" size={14} />Added {p.date}</span>
          </div>
        </div>

        <div className="pd-head__actions">
          <Button hierarchy="secondary" size="md" iconLeading="refresh-cw" onClick={onChangeStatus}>Change status</Button>
          <Button hierarchy="primary" size="md" iconLeading="pencil" onClick={onEdit}>Edit property</Button>
          <div className="pd-morewrap" ref={menuRef}>
            <button type="button" className={"pd-morebtn" + (menuOpen ? " is-open" : "")} aria-label="More actions"
            aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
              <Icon name="more-horizontal" size={19} />
            </button>
            {menuOpen &&
            <div className="pd-moremenu" role="menu">
                <button type="button" className="pd-moreitem" role="menuitem" onClick={() => {setMenuOpen(false);onAssignAgent();}}>
                  <Icon name={p.agent ? "user-cog" : "user-plus"} size={17} />{p.agent ? "Reassign agent" : "Assign agent"}
                </button>
                <button type="button" className="pd-moreitem" role="menuitem" onClick={() => {setMenuOpen(false);onArchive();}}>
                  <Icon name="archive" size={17} />Archive property
                </button>
                <div className="pd-moremenu__sep" />
                <button type="button" className="pd-moreitem pd-moreitem--danger" role="menuitem" onClick={() => {setMenuOpen(false);onDelete();}}>
                  <Icon name="trash-2" size={17} />Delete property
                </button>
              </div>}
          </div>
        </div>
      </div>
    </header>);
}

/* ------------------------------------------------------------------
   SECTION 2 — GALLERY
------------------------------------------------------------------ */
function Gallery({ p }) {
  const [active, setActive] = useStateP(0);
  const imgs = p.gallery;
  return (
    <SectionCard icon="images" title="Property gallery" desc={`${imgs.length} photos · cover image set`} id="gallery">
      <div className="pd-gallery">
        <div className="pd-gallery__main">
          <img src={imgs[active]} alt={p.title} />
          <span className="pd-gallery__cover"><Icon name="star" size={13} />{active === 0 ? "Cover image" : "Photo " + (active + 1)}</span>
        </div>
        <div className="pd-gallery__thumbs">
          {imgs.map((src, i) =>
          <button key={i} type="button"
          className={"pd-gallery__thumb" + (i === active ? " is-active" : "")}
          onClick={() => setActive(i)} aria-label={"View photo " + (i + 1)}>
              <img src={src} alt="" loading="lazy" />
              {i === 0 && <span className="pd-gallery__thumbtag"><Icon name="star" size={11} /></span>}
            </button>)}
        </div>
      </div>
    </SectionCard>);
}

/* ------------------------------------------------------------------
   SECTION 1 — PROPERTY INFORMATION
------------------------------------------------------------------ */
function PropertyInfo({ p }) {
  const s = p.specs;
  const dash = (v) => (v || v === 0) ? v : "—";
  const num = (v, suffix) => (v || v === 0) ? v.toLocaleString("en-US") + (suffix || "") : "—";
  return (
    <SectionCard title="Property information" desc="Core attributes, location, and specifications for this listing." id="info" flush>
      <div className="pd-detailgroups">
        <DGroup title="Basic information" desc="Identity and how the listing is classified." noRowDivider>
          <Field icon="type" label="Property name" value={p.title} />
          <Field icon="hash" label="Property ID" value={p.id} mono />
          <Field icon="building-2" label="Property type" value={p.type} />
          <Field icon={p.listing === "sale" ? "tag" : "key"} label="Listing type" value={p.listing === "sale" ? "For sale" : "For rent"} />
        </DGroup>

        <DGroup title="Pricing" desc="Listed price and valuation.">
          <Field icon="wallet" label={p.listing === "sale" ? "Asking price" : "Monthly rent"} value={fmtUSD(p.price) + (p.per || "")} em />
          <Field icon="banknote" label="Currency" value={s.currency} />
        </DGroup>

        <DGroup title="Location" desc="Where this property sits on the map." noRowDivider>
          <Field icon="building" label="City" value={p.city} />
          <Field icon="map-pin" label="Area / District" value={p.area} />
          <Field icon="navigation" label="Full address" value={s.address} />
          <Field icon="map" label="Map location" value={
            <a className="pd-maplink" href={s.mapUrl} target="_blank" rel="noopener noreferrer">
              {s.coords}<Icon name="external-link" size={13} />
            </a>} />
        </DGroup>

        <DGroup title="Property features" desc="Size, layout, and build details." noRowDivider>
          <Field icon="bed-double" label="Bedrooms" value={p.beds ? p.beds : "—"} />
          <Field icon="bath" label="Bathrooms" value={p.baths ? p.baths : "—"} />
          <Field icon="maximize-2" label="Area" value={num(p.size, " m²")} />
          <Field icon="land-plot" label="Land size" value={num(s.landSize, " m²")} />
          <Field icon="car" label="Garage spaces" value={dash(s.garages)} />
          <Field icon="calendar" label="Year built" value={dash(s.yearBuilt)} />
          <Field icon="sofa" label="Furnished" value={dash(s.furnished)} />
          <Field icon="layers" label="Floor" value={dash(s.floor)} />
        </DGroup>

        {s.amenities && s.amenities.length > 0 &&
          <section className="pd-dgroup">
            <header className="pd-dgroup__head">
              <h3 className="pd-dgroup__title">Amenities</h3>
              <p className="pd-dgroup__desc">Features and facilities included with this property.</p>
            </header>
            <div className="pd-amen">
              {s.amenities.map((a) =>
                <div className="pd-amenrow" key={a.label}>
                  <span className="pd-amenrow__ic"><Icon name={a.icon} size={17} /></span>
                  {a.label}
                </div>)}
            </div>
          </section>}
      </div>
    </SectionCard>);
}

/* ------------------------------------------------------------------
   SECTION 5 — LISTING INFORMATION
------------------------------------------------------------------ */
function ListingInfo({ p }) {
  const st = STATUS_META[p.status] || { variant: "neutral" };
  return (
    <SectionCard title="Listing information" desc="Visibility, placement, and listing timeline." id="listing" flush>
      <div className="pd-detailgroups">
        <DGroup title="Listing details" desc="How and when this listing is presented." noRowDivider>
          <Field icon={p.listing === "sale" ? "tag" : "key"} label="Listing type"
            value={<Badge variant={p.listing === "sale" ? "brand" : "info"} size="sm" icon={p.listing === "sale" ? "tag" : "key"}>{p.listing === "sale" ? "For sale" : "For rent"}</Badge>} />
          <Field icon="calendar-plus" label="Date created" value={p.specs.dateCreated} />
          <Field icon="sparkles" label="Featured"
            value={p.featured
              ? <Badge variant="gold" size="sm" icon="sparkles">Featured</Badge>
              : <Badge variant="neutral" size="sm" icon="minus">Standard</Badge>} />
          <Field icon="clock" label="Last updated" value={p.updated} />
          <Field icon="circle-dot" label="Status"
            value={<Badge variant={st.variant} size="sm" dot={st.dot} icon={st.icon}>{p.status}</Badge>} />
        </DGroup>
      </div>
    </SectionCard>);
}

/* ------------------------------------------------------------------
   SECTION 6 — INTERNAL NOTES
------------------------------------------------------------------ */
const NOTE_KIND = {
  approval: { icon: "check-circle", cls: "is-approval" },
  review: { icon: "shield-check", cls: "is-review" },
  note: { icon: "message-square", cls: "is-note" }
};
const NOTE_MAX = 500;
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
      <Textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        maxLength={NOTE_MAX}
        aria-label="New internal note"
        placeholder="Write a note about verification, approvals, pricing, or reminders for this listing…" />
      <div className="pd-notecomposer__foot">
        <span className={"pd-notecomposer__hint" + (remaining <= 50 ? " is-low" : "")}>{remaining} characters left</span>
        <div className="pd-notecomposer__actions">
          <Button hierarchy="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button hierarchy="primary" size="sm" disabled={!text} onClick={save}>Add note</Button>
        </div>
      </div>
    </div>);
}

function InternalNotes({ p, onAdd, onDelete }) {
  const [composing, setComposing] = useStateP(false);
  const roleLabel = (role) => {
    const r = (role || "").trim();
    if (!r) return "Note";
    return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() + " note";
  };
  const handleSave = (text) => { onAdd(text); setComposing(false); };
  return (
    <SectionCard icon="sticky-note" title="Internal notes" desc="Staff-only. Not visible to members or on the public site."
    action={!composing && <Button hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setComposing(true)}>Add note</Button>} id="notes">
      {composing && <NoteComposer spaced={p.notes.length > 0} onSave={handleSave} onCancel={() => setComposing(false)} />}
      {p.notes.length === 0 ?
      (!composing &&
      <div className="pd-noagent">
        <span className="pd-noagent__art"><Icon name="sticky-note" size={24} strokeWidth={1.6} /></span>
        <p>No internal notes yet. Add a staff-only note to track verification, approvals, or reminders for this listing.</p>
      </div>) :
      <div className="pd-notes">
        {p.notes.map((n, i) => {
          const k = NOTE_KIND[n.kind] || NOTE_KIND.note;
          return (
            <div className={"pd-noteitem " + k.cls} key={i}>
              <div className="pd-note__head">
                <span className="pd-note__label">{roleLabel(n.role)}</span>
                <button type="button" className="pd-note__delete"
                aria-label={"Delete note from " + n.author} title="Delete note"
                onClick={() => onDelete && onDelete(i)}>
                  <Icon name="trash-2" size={15} />
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

/* ------------------------------------------------------------------
   DELETE-NOTE CONFIRM MODAL  (same pp-modal style as property delete)
------------------------------------------------------------------ */
function DeleteNoteModal({ note, onCancel, onConfirm }) {
  useEffectP(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const r = (note.role || "").trim();
  const roleLabel = r ? r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() + " note" : "note";
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="delnote-modal-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="delnote-modal-title">Delete note?</h2>
        <p className="pp-modal__body">
          Are you sure you want to delete this <strong>{roleLabel.toLowerCase()}</strong>? This action cannot be undone and will permanently remove it from this property.
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}><Icon name="trash-2" size={15} />Delete note</button>
        </div>
      </div>
    </div>,
    document.body);
}

/* ------------------------------------------------------------------
   SECTION 7 — ACTIVITY TIMELINE
------------------------------------------------------------------ */
const TL_TONE = {
  brand: "#7F56D9", success: "#15B79E", info: "#2E90FA",
  warning: "#EAB308", error: "#F04438", gold: "#EE46BC", neutral: "#6172F3"
};
function Timeline({ p }) {
  return (
    <SectionCard icon="history" title="Activity timeline" desc="Chronological log of every change to this listing."
    action={<Button hierarchy="link" size="sm" iconTrailing="arrow-right" style={{ color: "var(--text-secondary)" }} onClick={() => {window.location.href = PAGE_MAP.activity;}}>View all</Button>} id="activity">
      <ol className="pd-timeline">
        {p.timeline.map((e, i) =>
        <li className="pd-tl" key={i}>
            <span className="pd-tl__dot" style={{ background: TL_TONE[e.tone], boxShadow: `0 0 0 4px color-mix(in srgb, ${TL_TONE[e.tone]} 16%, transparent)` }}>
              <Icon name={e.icon} size={13} strokeWidth={2.2} />
            </span>
            <div className="pd-tl__body">
              <div className="pd-tl__top">
                <span className="pd-tl__title">{e.title}</span>
                <span className="pd-tl__time">{e.time}</span>
              </div>
              <p className="pd-tl__desc">{e.desc}</p>
            </div>
          </li>)}
      </ol>
    </SectionCard>);
}

/* ------------------------------------------------------------------
   SECTION 3 — OWNERSHIP  (aside)
------------------------------------------------------------------ */
function Ownership({ p }) {
  return (
    <SectionCard icon="user-round" title="Ownership" desc="Private owner contact details." id="owner">
      <div className="pd-owner">
        <Avatar name={p.owner.name} size="lg" />
        <div className="pd-owner__id">
          <span className="pd-owner__name">{p.owner.name}</span>
          <span className="pd-owner__type"><Icon name={p.owner.type.startsWith("Company") ? "building" : "user"} size={13} />{p.owner.type}</span>
        </div>
      </div>
      <div className="pd-contactlist">
        <a className="pd-contact" href={"tel:" + p.owner.phone.replace(/\s/g, "")}>
          <span className="pd-contact__icon"><Icon name="phone" size={16} /></span>
          <div className="pd-contact__text"><span className="pd-contact__label">Phone</span><span className="pd-contact__value">{p.owner.phone}</span></div>
          <Icon name="external-link" size={15} className="pd-contact__go" />
        </a>
        <a className="pd-contact" href={"mailto:" + p.owner.email}>
          <span className="pd-contact__icon"><Icon name="mail" size={16} /></span>
          <div className="pd-contact__text"><span className="pd-contact__label">Email</span><span className="pd-contact__value">{p.owner.email}</span></div>
          <Icon name="external-link" size={15} className="pd-contact__go" />
        </a>
      </div>
    </SectionCard>);
}

/* ------------------------------------------------------------------
   SECTION — VIEWING REQUESTS  (main column)
------------------------------------------------------------------ */
function ViewingRequests({ p }) {
  const rows = getViewings(p.id);
  const upcoming = rows.filter((r) => r.status === "Scheduled" || r.status === "Confirmed").length;
  return (
    <SectionCard icon="calendar-check" title="Viewing requests"
    desc={rows.length ? `${rows.length} request${rows.length > 1 ? "s" : ""} \u00b7 ${upcoming} upcoming` : "Requests to view this property will appear here."}
    action={rows.length ? <Button hierarchy="link" size="sm" iconTrailing="arrow-right" style={{ color: "var(--text-secondary)" }} onClick={() => {window.location.href = PAGE_MAP.viewings;}}>View all</Button> : null} id="viewings">
      {rows.length === 0 ?
      <div className="pd-noagent">
        <span className="pd-noagent__art"><Icon name="calendar" size={24} strokeWidth={1.6} /></span>
        <p>No viewing requests yet. New requests from members and agents will show up here.</p>
      </div> :
      <div className="pd-viewings">
        {rows.map((r) => {
          const st = VIEWING_STATUS[r.status] || { variant: "neutral", icon: "clock" };
          return (
            <div className="pd-viewing" key={r.id}>
              <Avatar src={r.img} name={r.member} size="lg" />
              <div className="pd-viewing__main">
                <span className="pd-viewing__name">{r.member}</span>
                <span className="pd-viewing__meta">{r.date + " \u00b7 " + r.time}</span>
              </div>
              <Badge variant={st.variant} size="sm" icon={st.icon}>{r.status}</Badge>
            </div>);
        })}
      </div>}
    </SectionCard>);
}

/* ------------------------------------------------------------------
   SECTION 4 — ASSIGNED AGENT  (aside)
------------------------------------------------------------------ */
function AssignedAgent({ p, onAssignAgent }) {
  if (!p.agent) {
    return (
      <SectionCard icon="badge-check" title="Assigned agent" desc="No agent is managing this listing yet." id="agent">
        <div className="pd-noagent">
          <span className="pd-noagent__art"><Icon name="user-plus" size={24} strokeWidth={1.6} /></span>
          <p>Assign a verified agent to handle viewings, enquiries, and the sale.</p>
          <Button hierarchy="primary" size="sm" iconLeading="user-plus" onClick={onAssignAgent}>Assign agent</Button>
        </div>
      </SectionCard>);
  }
  const a = p.agent;
  const phoneHref = "tel:" + a.phone.replace(/\s/g, "");
  const waHref = "https://wa.me/" + a.phone.replace(/[^\d]/g, "");
  const broker = a.agency || "Chiya Premier";
  const rating = a.rating || "4.8";
  const reviews = a.reviews || 96;
  return (
    <SectionCard icon="badge-check" title="Assigned agent" desc="Manages viewings and enquiries."
    action={<Button hierarchy="ghost" size="sm" iconLeading="user-cog" onClick={onAssignAgent}>Reassign</Button>} id="agent">
      <a className="pd-agent pd-agent--link" href={PAGE_MAP.agents} title={"View " + a.name + "’s details"}>
        <Avatar src={a.img} name={a.name} size="xl" verified={a.verified} />
        <div className="pd-agent__id">
          <span className="pd-agent__nrow">
            <span className="pd-agent__name">{a.name}</span>
            {a.verified ?
            <Badge variant="brand" size="sm" icon="badge-check">Verified</Badge> :
            <Badge variant="warning" size="sm" icon="clock">Pending</Badge>}
          </span>
          <span className="pd-agent__meta">
            <span className="pd-agent__broker"><Icon name="building-2" size={15} />{broker}</span>
            <span className="pd-agent__rate"><Icon name="star" size={15} />{rating}</span>
            <span className="pd-agent__reviews">({reviews} reviews)</span>
          </span>
        </div>
        <Icon name="chevron-right" size={18} className="pd-agent__go" />
      </a>
      <div className="pd-agent__actions">
        <a className="pd-agentbtn" href={phoneHref}><Icon name="phone" size={18} />Call</a>
        <a className="pd-agentbtn" href={waHref} target="_blank" rel="noopener noreferrer"><Icon name="message-circle" size={18} />WhatsApp</a>
      </div>
      <p className="pd-agent__trust"><Icon name="shield-check" size={15} />Verified agent · no obligation · ID-checked</p>
    </SectionCard>);
}

/* ------------------------------------------------------------------
   DETAIL PAGE
------------------------------------------------------------------ */
function PropertyDetailsPage() {
  const [property, setProperty] = useStateP(() => getProperty(qid()));
  const [statusOpen, setStatusOpen] = useStateP(false);
  const [agentOpen, setAgentOpen] = useStateP(false);
  const [confirm, setConfirm] = useStateP(null); // 'archive' | 'delete'
  const [noteToDelete, setNoteToDelete] = useStateP(null);
  const [toasts, pushToast, dismissToast] = useToasts();

  const onEdit = () => {window.location.href = "Admin-Edit Property page.html?from=details&id=" + encodeURIComponent(property.id);};

  // show the success toast when returning here after an update
  useEffectP(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("toast") === "updated") {
      pushToast({ tone: "success", icon: "circle-check", title: "Property updated", msg: `“${property.title}” has been updated successfully.` });
      params.delete("toast");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
    }
  }, []);

  const handleStatus = (status) => {
    setProperty((p) => ({ ...p, status, published: status === "Published" ? true : p.published }));
    setStatusOpen(false);
    pushToast({ tone: "brand", icon: "refresh-cw", title: "Status updated", msg: `“${property.title}” is now marked as ${status}.` });
  };
  const handleAssign = (agent) => {
    const wasAssigned = !!property.agent;
    const enriched = { ...agent, email: agent.email || agent.name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@mail.chiya.estate", listings: agent.listings || 8 };
    setProperty((p) => ({ ...p, agent: enriched }));
    setAgentOpen(false);
    pushToast({ tone: "success", icon: "user-check", title: wasAssigned ? "Agent changed" : "Agent assigned",
      msg: `${agent.name} is now the assigned agent for “${property.title}”.` });
  };
  const handleArchive = () => {
    setProperty((p) => ({ ...p, status: "Archived", published: false }));
    setConfirm(null);
    pushToast({ tone: "brand", icon: "archive", title: "Property archived", msg: `“${property.title}” has been moved to the archive.` });
  };
  const handleDelete = () => {
    setConfirm(null);
    pushToast({ tone: "danger", icon: "trash-2", title: "Property deleted", msg: `“${property.title}” has been permanently removed. Returning to Properties…` });
    setTimeout(() => {window.location.href = PAGE_MAP.properties;}, 1400);
  };
  const handleAddNote = (text) => {
    const note = { author: ADMIN.name, role: ADMIN.role, kind: "note", time: nowStamp(), text };
    setProperty((p) => ({ ...p, notes: [note, ...p.notes] }));
    pushToast({ tone: "success", icon: "circle-check", title: "Note added", msg: "Your internal note has been added to this property." });
  };
  const handleDeleteNote = () => {
    const idx = noteToDelete;
    const removed = property.notes[idx];
    setProperty((p) => ({ ...p, notes: p.notes.filter((_, i) => i !== idx) }));
    setNoteToDelete(null);
    pushToast({
      tone: "danger", icon: "trash-2", title: "Note deleted", msg: "The internal note has been removed.",
      onUndo: () => setProperty((p) => {
        const notes = [...p.notes];
        notes.splice(idx, 0, removed);
        return { ...p, notes };
      })
    });
  };

  return (
    <React.Fragment>
      <DetailHeader p={property}
      onEdit={onEdit}
      onChangeStatus={() => setStatusOpen(true)}
      onAssignAgent={() => setAgentOpen(true)}
      onArchive={() => setConfirm("archive")}
      onDelete={() => setConfirm("delete")} />

      <div className="pd-grid">
        <div className="pd-grid__main">
          <Gallery p={property} />
          <PropertyInfo p={property} />
          <ListingInfo p={property} />
          <InternalNotes p={property} onAdd={handleAddNote} onDelete={(i) => setNoteToDelete(i)} />
          <ViewingRequests p={property} />
          <Timeline p={property} />
        </div>
        <aside className="pd-grid__aside">
          <Ownership p={property} />
          <AssignedAgent p={property} onAssignAgent={() => setAgentOpen(true)} />
        </aside>
      </div>

      {statusOpen && <ChangeStatusModal property={property} onCancel={() => setStatusOpen(false)} onConfirm={handleStatus} />}
      {agentOpen && <AssignAgentModal property={property} onCancel={() => setAgentOpen(false)} onConfirm={handleAssign} />}
      {confirm && <ConfirmModal kind={confirm} property={property} onCancel={() => setConfirm(null)} onConfirm={confirm === "delete" ? handleDelete : handleArchive} />}
      {noteToDelete !== null && property.notes[noteToDelete] &&
      <DeleteNoteModal note={property.notes[noteToDelete]} onCancel={() => setNoteToDelete(null)} onConfirm={handleDeleteNote} />}

      <div className="pp-toaster" aria-live="polite">
        {toasts.map((t) => <PropToast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />)}
      </div>
    </React.Fragment>);
}

/* ==================================================================
   APP SHELL
================================================================== */
function categoryFor(w) {
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function App() {
  const [collapsed, setCollapsed] = useStateP(() => categoryFor(window.innerWidth) !== "mobile");
  const [drawerOpen, setDrawerOpen] = useStateP(false);
  const [openMenu, setOpenMenu] = useStateP(null);
  const catRef = useRefP(categoryFor(window.innerWidth));

  useEffectP(() => {
    const onResize = () => {
      const cat = categoryFor(window.innerWidth);
      if (cat !== catRef.current) {
        catRef.current = cat;
        if (cat === "tablet") setCollapsed(true);else
        if (cat !== "mobile") setDrawerOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffectP(() => {
    const onKey = (e) => {if (e.key === "Escape") {setOpenMenu(null);setDrawerOpen(false);}};
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = useCallbackP((id) => {
    const here = decodeURIComponent(window.location.pathname.split("/").pop());
    if (PAGE_MAP[id] && PAGE_MAP[id] !== here) {window.location.href = PAGE_MAP[id];return;}
    setOpenMenu(null);
    if (categoryFor(window.innerWidth) === "mobile") setDrawerOpen(false);
  }, []);

  return (
    <div className="ax-app" data-layout="B">
      <Sidebar collapsed={collapsed} drawerOpen={drawerOpen} active="properties"
      onSelect={handleSelect} onToggleCollapse={() => setCollapsed((c) => !c)} />

      {drawerOpen && <div className="ax-backdrop" onClick={() => setDrawerOpen(false)} />}

      <div className="ax-main">
        <Topbar openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />
        <main className="ax-content" data-screen-label="Admin · Property Details">
          <PropertyDetailsPage />
        </main>
      </div>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
    </div>);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);