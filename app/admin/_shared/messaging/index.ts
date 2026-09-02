/* Messaging — the automatic notices to tenants and landlords, the templates
   behind them, and the modal a person uses to write one by hand.

   One import path for the two screens that need it: the messaging hub
   (app/admin/_messaging) and the contract detail page, which shows the parties'
   numbers and opens the send modal. Read ./types first — it states the three
   rules the rest of the folder follows.

   THE BARREL IS THE SURFACE, not a re-export of everything. `buildOutbox`, the
   quiet-hours arithmetic and the raw store internals are how this folder works;
   what the screens outside it need is below and nothing more. Same rule as
   ../finance/index. */

export {
  DEFAULT_TEMPLATES,
  MSG_STATUSES,
  NOW_HOUR,
  NOW_ISO,
  PROVIDERS,
  TEMPLATE_IDS,
  TEMPLATE_TOKENS,
  hourLabel,
  isDialable,
  maskKey,
  renderBody,
  telLink,
  waLink,
} from "./types";
export type {
  MessageLogRow,
  MessageTemplate,
  MsgAudience,
  MsgStatus,
  MsgTemplateId,
  WhatsAppSettings,
} from "./types";

export { logSentMessage, saveTemplate, saveWhatsAppSettings, useTemplates, useWhatsAppSettings } from "./store";

export { useContractMessages, useMessageLog, useMessageParties } from "./outbox";

export { SendMessageModal } from "./send-modal";
