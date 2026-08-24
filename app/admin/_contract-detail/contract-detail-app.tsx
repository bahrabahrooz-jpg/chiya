"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang, isRtl } from "@/lib/i18n";
import { fmtDate, fmtNum, fmtPercent, localizeDigits } from "@/lib/fmt";
import { formatMoney } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";
import {
  CATEGORY_ICON,
  INVOICE_COLLAPSE_AT,
  INVOICE_STATUS_META,
  KIND_META,
  STATUS_META,
  contractValue,
  cycleCount,
  displayStatusOnCancelled,
  isEditable,
  managementFeeAmount,
  toInvoiceRows,
  type ContractRecord,
  type InvoiceRow,
} from "./data";

/* ============================================================================
   Contract detail.

   Modelled on the property detail screen (app/admin/_property-detail): the same
   pd-head header shape, the same section cards, the same ⋯ menu.

   THE TERMS BLOCK IS PLAIN TEXT WHENEVER THE CONTRACT IS NOT A DRAFT. Not
   disabled inputs — text. A signed contract is an agreement between people, and
   a screen full of greyed-out fields says "you could edit this if you had
   permission", which is the wrong idea entirely: correcting a signed contract
   means cancelling it and writing a replacement. See `isEditable`.

   Every action that would change something is disabled with a TODO naming the
   task that will enable it. This screen reads; it does not write.
   ========================================================================== */

/* ---------------- shared bits ---------------- */

function SectionCard({ title, desc, action, children, id }: { title: string; desc?: string; action?: ReactNode; children: ReactNode; id?: string }) {
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
      <div className="pd-card__body">{children}</div>
    </section>
  );
}

/** One read-only term. `num` switches on tabular figures so a column of money
    or dates lines up down the page. */
function Field({ icon, label, value, num, em }: { icon: IconName; label: string; value: ReactNode; num?: boolean; em?: boolean }) {
  return (
    <div className={"pd-field" + (em ? " pd-field--em" : "")}>
      <span className="pd-field__icon">
        <Icon name={icon} size={18} />
      </span>
      <div className="pd-field__text">
        <span className="pd-field__label">{label}</span>
        <span className={"pd-field__value" + (num ? " ctd-num" : "")}>{value}</span>
      </div>
    </div>
  );
}

function DGroup({ title, children, cols }: { title: string; children: ReactNode; cols?: number }) {
  return (
    <section className="pd-dgroup">
      <header className="pd-dgroup__head">
        <h3 className="pd-dgroup__title">{title}</h3>
      </header>
      <div className={"pd-dl" + (cols === 1 ? " pd-dl--one" : "")}>{children}</div>
    </section>
  );
}

/* ---------------- header ---------------- */

function DetailHeader({ c, counterparty }: { c: ContractRecord; counterparty: string | null }) {
  const { t, lang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const st = STATUS_META[c.status];
  const kind = KIND_META[c.kind];

  return (
    <div className="pd-head__main">
      <div className="pd-head__intro">
        <div className="pd-head__titlerow">
          <h1 className="pd-head__title">{localizeDigits(lang, c.id)}</h1>
          <span className="pd-head__badges">
            <Badge variant={kind.variant} size="md">
              {t(`admin.ct.kind.${c.kind}`)}
            </Badge>
            <Badge variant={st.variant} size="md" dot={st.dot} icon={st.icon}>
              {t(`admin.ct.status.${c.status}`)}
            </Badge>
          </span>
        </div>
        <div className="pd-head__meta">
          <span className="pd-head__metaitem">
            <Icon name="user-round" size={15} />
            {counterparty ?? t("admin.pd.noCounterparty")}
          </span>
          <span className="pd-head__sep" />
          <span className="pd-head__metaitem">
            <Icon name="calendar-check" size={15} />
            {c.signedOn ? t("admin.ct.signedOnDate", { date: fmtDate(lang, fromIso(c.signedOn)) }) : t("admin.ct.unsigned")}
          </span>
          <span className="pd-head__sep" />
          <span className="pd-head__metaitem">
            <Icon name="file-pen" size={15} />
            {t("admin.ct.writtenOnDate", { date: fmtDate(lang, fromIso(c.createdOn)) })}
          </span>
        </div>
      </div>

      <div className="pd-head__actions">
        {/* TODO(contract print/PDF task): no document is rendered yet. */}
        <Button hierarchy="secondary" size="md" iconLeading="printer" disabled>
          {t("admin.ct.print")}
        </Button>
        <div className="pd-morewrap" ref={menuRef}>
          <button
            type="button"
            className={"pd-morebtn" + (menuOpen ? " is-open" : "")}
            aria-label={t("admin.props.actions")}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icon name="more-horizontal" size={19} />
          </button>
          {menuOpen && (
            <div className="pd-moremenu" role="menu">
              {/* Every item here writes something, and nothing on this screen
                  writes yet. They render disabled rather than being left out so
                  the menu keeps the shape it will have.
                  TODO(payments task): Record payment.
                  TODO(NewContractModal task): Cancel contract, Renew. */}
              <button type="button" className="pd-moreitem" role="menuitem" disabled>
                <Icon name="banknote" size={17} />
                {t("admin.ct.recordPayment")}
              </button>
              <button type="button" className="pd-moreitem" role="menuitem" disabled>
                <Icon name="repeat" size={17} />
                {t("admin.ct.renew")}
              </button>
              <div className="pd-moremenu__sep" />
              <button type="button" className="pd-moreitem pd-moreitem--danger" role="menuitem" disabled>
                <Icon name="ban" size={17} />
                {t("admin.ct.cancelContract")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- cancelled banner ---------------- */

function CancelledBanner({ c }: { c: ContractRecord }) {
  const { t, lang } = useLang();
  return (
    <div className="ctd-banner" role="status">
      <span className="ctd-banner__icon">
        <Icon name="ban" size={20} />
      </span>
      <div className="ctd-banner__body">
        <p className="ctd-banner__title">
          {c.cancelledOn ? t("admin.ct.cancelledOnDate", { date: fmtDate(lang, fromIso(c.cancelledOn)) }) : t("admin.ct.status.cancelled")}
        </p>
        {c.cancelReason && <p className="ctd-banner__reason">{c.cancelReason}</p>}
        <p className="ctd-banner__note">{t("admin.ct.cancelledNote")}</p>
      </div>
    </div>
  );
}

/* ---------------- terms ---------------- */

function Terms({
  c,
  propertyTitle,
  ownerName,
  counterparty,
  counterpartyId,
  agentName,
  basePath,
}: {
  c: ContractRecord;
  propertyTitle: string;
  ownerName: string;
  counterparty: string | null;
  counterpartyId?: string;
  agentName: string;
  basePath: string;
}) {
  const { t, lang } = useLang();
  const editable = isEditable(c);
  const mgmt = managementFeeAmount(c);
  const cycles = cycleCount(c);
  const memberBase = basePath.replace(/\/contracts$/, "/members");
  const propBase = basePath.replace(/\/contracts$/, "/properties");

  return (
    <SectionCard
      title={t("admin.ct.terms")}
      desc={t(editable ? "admin.ct.termsDraftDesc" : c.status === "cancelled" ? "admin.ct.termsCancelledDesc" : "admin.ct.termsLockedDesc")}
      action={
        /* Only a draft may be edited at all, and even then the form is the
           NewContractModal task. On a signed contract there is no Edit button
           to disable — the answer is Cancel and replace, not "edit later".
           TODO(NewContractModal task): enable for drafts. */
        editable ? (
          <Button hierarchy="secondary" size="sm" iconLeading="pencil" disabled>
            {t("admin.ct.edit")}
          </Button>
        ) : undefined
      }
      id="terms"
    >
      <DGroup title={t("admin.ct.parties")}>
        <Field
          icon="building-2"
          label={t("admin.ct.f.property")}
          value={
            <Link className="ctd-link" href={`${propBase}/${encodeURIComponent(c.propertyId)}`}>
              {propertyTitle}
            </Link>
          }
        />
        <Field
          icon="user-round"
          label={t(c.kind === "sale" ? "admin.pd.seller" : "admin.pd.landlord")}
          value={
            <Link className="ctd-link" href={`${memberBase}/${encodeURIComponent(c.ownerId)}`}>
              {ownerName}
            </Link>
          }
        />
        <Field
          icon="user"
          label={t(c.kind === "sale" ? "admin.pd.buyer" : "admin.pd.tenant")}
          value={
            counterparty ? (
              counterpartyId ? (
                <Link className="ctd-link" href={`${memberBase}/${encodeURIComponent(counterpartyId)}`}>
                  {counterparty}
                </Link>
              ) : (
                <>
                  {counterparty}
                  <span className="ct-party__ext">{t("admin.pd.externalParty")}</span>
                </>
              )
            ) : (
              t("admin.pd.noCounterparty")
            )
          }
        />
        <Field icon="badge-check" label={t("admin.ct.f.agent")} value={agentName} />
      </DGroup>

      <DGroup title={t("admin.ct.money")}>
        <Field
          icon="coins"
          label={t(c.kind === "sale" ? "admin.ct.f.price" : "admin.ct.f.rentPerCycle")}
          value={formatMoney(lang, c.price)}
          num
          em
        />
        <Field
          icon="percent"
          label={t("admin.ct.f.commission")}
          value={
            <>
              {formatMoney(lang, c.commission)}
              <span className="ctd-rate">
                {t(c.kind === "sale" ? "admin.ct.rateOfPrice" : "admin.ct.rateOfCycle", { rate: fmtPercent(lang, c.commissionRate) })}
              </span>
            </>
          }
          num
        />
        {c.deposit && <Field icon="wallet" label={t("admin.ct.f.deposit")} value={formatMoney(lang, c.deposit)} num />}
        {c.kind === "rent" && (
          <Field
            icon="landmark"
            label={t("admin.ct.f.totalValue")}
            value={t("admin.ct.totalOverCycles", { total: formatMoney(lang, contractValue(c)), count: fmtNum(lang, cycles) })}
            num
          />
        )}
      </DGroup>

      <DGroup title={t("admin.ct.dates")}>
        <Field icon="file-pen" label={t("admin.ct.f.createdOn")} value={fmtDate(lang, fromIso(c.createdOn))} num />
        <Field
          icon="calendar-check"
          label={t("admin.ct.f.signedOn")}
          value={c.signedOn ? fmtDate(lang, fromIso(c.signedOn)) : t("admin.ct.unsigned")}
          num
        />
        {c.handoverOn && <Field icon="key" label={t("admin.ct.f.handoverOn")} value={fmtDate(lang, fromIso(c.handoverOn))} num />}
        {c.cancelledOn && <Field icon="ban" label={t("admin.ct.f.cancelledOn")} value={fmtDate(lang, fromIso(c.cancelledOn))} num />}
      </DGroup>

      {c.kind === "rent" && (
        <DGroup title={t("admin.ct.tenancy")}>
          <Field icon="repeat" label={t("admin.ct.f.cycle")} value={t(`admin.ct.cycle.${c.cycle}`)} />
          <Field icon="clock" label={t("admin.ct.f.term")} value={t("admin.ct.termMonths", { count: fmtNum(lang, c.termMonths ?? 0) })} num />
          <Field
            icon="calendar-days"
            label={t("admin.ct.f.startsOn")}
            value={c.startsOn ? fmtDate(lang, fromIso(c.startsOn)) : "—"}
            num
          />
          <Field icon="calendar-days" label={t("admin.ct.f.endsOn")} value={c.endsOn ? fmtDate(lang, fromIso(c.endsOn)) : "—"} num />
          <Field icon="banknote" label={t("admin.ct.f.rentPaidTo")} value={t(`admin.ct.paidTo.${c.rentPaidTo}`)} />
          {c.managementFee && (
            <Field
              icon="receipt"
              label={t("admin.ct.f.managementFee")}
              value={
                c.managementFee.type === "percent"
                  ? t("admin.ct.mgmtPercent", {
                      rate: fmtPercent(lang, c.managementFee.value),
                      amount: mgmt ? formatMoney(lang, mgmt) : "",
                    })
                  : formatMoney(lang, mgmt ?? c.price)
              }
              num
            />
          )}
        </DGroup>
      )}

      {c.notes && (
        <DGroup title={t("admin.ct.notes")} cols={1}>
          <Field icon="file-text" label={t("admin.ct.internalNote")} value={c.notes} />
        </DGroup>
      )}
    </SectionCard>
  );
}

/* ---------------- provenance: renewal chain + external paperwork ---------- */

function Provenance({ c, previous, next, basePath }: { c: ContractRecord; previous?: ContractRecord; next?: ContractRecord; basePath: string }) {
  const { t, lang } = useLang();
  if (!previous && !next && !c.externalPaperwork) return null;
  return (
    <SectionCard title={t("admin.ct.provenance")} desc={t("admin.ct.provenanceDesc")} id="provenance">
      <div className="ctd-chain">
        {previous && (
          <p className="ctd-chain__line">
            <Icon name={isRtl(lang) ? "arrow-right" : "arrow-left"} size={15} />
            {t("admin.ct.replacesLine")}
            <Link className="ctd-link ctd-link--mono" href={`${basePath}/${encodeURIComponent(previous.id)}`}>
              {localizeDigits(lang, previous.id)}
            </Link>
          </p>
        )}
        {next && (
          <p className="ctd-chain__line">
            <Icon name={isRtl(lang) ? "arrow-left" : "arrow-right"} size={15} />
            {t("admin.ct.replacedByLine")}
            <Link className="ctd-link ctd-link--mono" href={`${basePath}/${encodeURIComponent(next.id)}`}>
              {localizeDigits(lang, next.id)}
            </Link>
          </p>
        )}
        {c.externalPaperwork && (
          <p className="ctd-chain__line ctd-chain__line--note">
            <Icon name="file-x" size={15} />
            {t("admin.ct.externalPaperwork")}
          </p>
        )}
      </div>
    </SectionCard>
  );
}

/* ---------------- invoices ---------------- */

function InvoiceRowView({ row, cancelled }: { row: InvoiceRow; cancelled: boolean }) {
  const { t, lang } = useLang();
  const inv = row.invoice;
  /* On a cancelled contract an uncollectable demand reads as Void — nothing is
     removed, and a paid invoice keeps saying it was paid. */
  const status = cancelled ? displayStatusOnCancelled(row) : row.status;
  const meta = INVOICE_STATUS_META[status];
  const label =
    status === "overdue" ? t("admin.ct.inv.overdueDays", { count: fmtNum(lang, row.lateDays) }) : t(`admin.ct.inv.${status}`);

  return (
    <div className={"ctd-inv" + (status === "void" ? " is-void" : "")}>
      <span className="ctd-inv__icon">
        <Icon name={CATEGORY_ICON[inv.category]} size={16} />
      </span>
      <span className="ctd-inv__number">{inv.number ? localizeDigits(lang, inv.number) : t("admin.ct.inv.unnumbered")}</span>
      <span className="ctd-inv__desc">{inv.lines[0]?.description ?? ""}</span>
      <span className="ctd-inv__due">{t("admin.ct.inv.due", { date: fmtDate(lang, fromIso(inv.dueOn)) })}</span>
      <Badge variant={meta.variant} size="sm" dot={meta.dot} icon={meta.icon}>
        {label}
      </Badge>
      {/* formatMoney, never formatApprox — an invoice total is what someone owes. */}
      <span className="ctd-inv__amount">{formatMoney(lang, row.total)}</span>
    </div>
  );
}

function Invoices({ rows, cancelled }: { rows: InvoiceRow[]; cancelled: boolean }) {
  const { t, lang } = useLang();
  const [expanded, setExpanded] = useState(false);
  const collapses = rows.length > INVOICE_COLLAPSE_AT;
  const shown = collapses && !expanded ? rows.slice(0, INVOICE_COLLAPSE_AT) : rows;

  if (rows.length === 0) {
    return (
      <SectionCard title={t("admin.ct.invoices")} desc={t("admin.ct.invoicesEmptyDesc")} id="invoices">
        <div className="ctd-empty">
          <span className="ctd-empty__art">
            <Icon name="receipt" size={24} strokeWidth={1.6} />
          </span>
          <p>{t("admin.ct.invoicesEmpty")}</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("admin.ct.invoices")}
      desc={t(rows.length === 1 ? "admin.ct.invoicesCountOne" : "admin.ct.invoicesCount", { count: fmtNum(lang, rows.length) })}
      id="invoices"
    >
      <div className="ctd-invs">
        {shown.map((r) => (
          <InvoiceRowView key={r.invoice.id} row={r} cancelled={cancelled} />
        ))}
      </div>
      {collapses && (
        <button type="button" className="ctd-showall" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          <Icon name={expanded ? "chevron-up" : "chevron-down"} size={15} />
          {expanded ? t("admin.ct.showFewer") : t("admin.ct.showAll", { count: fmtNum(lang, rows.length - INVOICE_COLLAPSE_AT) })}
        </button>
      )}
    </SectionCard>
  );
}

/* ---------------- page ---------------- */

export function ContractDetailApp({ id, agentSurface }: { id: string; agentSurface?: boolean }) {
  const { t, lang } = useLang();
  const { getContract, invoicesByContract, payments, previousContract, replacedBy } = useContracts();
  const { properties, members, agents } = useProperties();
  const base = agentSurface ? "/agent" : "/admin";
  const basePath = `${base}/contracts`;

  const contract = getContract(id);

  const invoiceRows = useMemo(
    () => (contract ? toInvoiceRows(invoicesByContract(contract.id), payments) : []),
    // invoicesByContract is rebuilt whenever the store's invoices change, so it
    // is the dependency that actually tracks the data.
    [contract, invoicesByContract, payments],
  );

  if (!contract) {
    return (
      <div className="ctd-missing">
        <span className="ctd-empty__art">
          <Icon name="file-x" size={26} strokeWidth={1.6} />
        </span>
        <h1>{t("admin.ct.notFound")}</h1>
        <p>{t("admin.ct.notFoundSub", { id })}</p>
        <Button href={basePath} hierarchy="secondary" size="md" iconLeading={isRtl(lang) ? "arrow-right" : "arrow-left"}>
          {t("admin.ct.backToList")}
        </Button>
      </div>
    );
  }

  const propertyTitle = properties.find((p) => p.id === contract.propertyId)?.title ?? contract.propertyId;
  const ownerName = members.find((m) => m.id === contract.ownerId)?.name ?? contract.ownerId;
  const linked = contract.buyerId ? members.find((m) => m.id === contract.buyerId)?.name : undefined;
  const counterparty = linked ?? contract.buyerExternal?.name ?? null;
  const agentName = agents.find((a) => a.id === contract.agentId)?.name ?? contract.agentId;
  const cancelled = contract.status === "cancelled";

  return (
    <>
      <header className="pd-head">
        <nav className="pd-breadcrumb" aria-label={t("admin.common.breadcrumb")}>
          <Link href={basePath}>{t("admin.nav.contracts")}</Link>
          <Icon name={isRtl(lang) ? "chevron-left" : "chevron-right"} size={14} />
          <span aria-current="page">{localizeDigits(lang, contract.id)}</span>
        </nav>

        <div className="vwd-panel">
          <div className="vwd-hero">
            <DetailHeader c={contract} counterparty={counterparty} />
          </div>
        </div>
      </header>

      {cancelled && <CancelledBanner c={contract} />}

      <div className="ctd-stack">
        <Terms
          c={contract}
          propertyTitle={propertyTitle}
          ownerName={ownerName}
          counterparty={counterparty}
          counterpartyId={linked ? contract.buyerId : undefined}
          agentName={agentName}
          basePath={basePath}
        />
        <Provenance c={contract} previous={previousContract(contract)} next={replacedBy(contract)} basePath={basePath} />
        <Invoices rows={invoiceRows} cancelled={cancelled} />
      </div>
    </>
  );
}
