# M1 Chat Demo

Brand-specific demo built on the NICE CXone Chat Web SDK v3. Styled and configured for M1 (Singapore telco). The bot persona is **Mindy**.

---

## How to run the demo

```bash
npm install
cp .env.sample .env
# fill in REACT_APP_BRAND_ID, REACT_APP_CHANNEL_ID, REACT_APP_ENVIRONMENT in .env
npm start
```

`npm start` runs HTTPS on `https://localhost:3000`. Accept the self-signed cert in the browser.

Set `REACT_APP_VARIANT=MULTITHREAD` in `.env` for the full M1 experience (thread list + chat view). The `MESSENGER` variant renders a single-thread window using the same M1 styling.

---

## Configuration options

All config is via `.env` (copy from `.env.sample`):

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_BRAND_ID` | Yes | CXone brand ID (integer) |
| `REACT_APP_CHANNEL_ID` | Yes | CXone digital channel ID |
| `REACT_APP_ENVIRONMENT` | Yes | SDK environment — e.g. `NA1`, `EU1`, `AU1`, or `custom` |
| `REACT_APP_VARIANT` | Yes | App variant — use `MULTITHREAD` for M1 demo |
| `REACT_APP_CUSTOM_ENVIRONMENT_AUTHORIZE` | If `custom` | Custom auth endpoint |
| `REACT_APP_CUSTOM_ENVIRONMENT_CHAT` | If `custom` | Custom chat endpoint |
| `REACT_APP_CUSTOM_ENVIRONMENT_GATEWAY` | If `custom` | Custom gateway endpoint |
| `REACT_APP_CUSTOM_ENVIRONMENT_NAME` | If `custom` | Custom environment name |
| `REACT_APP_OAUTH_ENABLED` | No | Set `1` to enable OAuth flow |
| `REACT_APP_OAUTH_PROVIDER_URL` | If OAuth | OAuth provider URL |
| `REACT_APP_OAUTH_REDIRECT_URI` | If OAuth | OAuth redirect URI |
| `REACT_APP_OAUTH_CLIENT_ID` | If OAuth | OAuth client ID |
| `REACT_APP_DEBUG_TOOLS_ENABLED` | No | Set `1` to enable debug panel |

The M1 branding (colours, font, border radius) is hardcoded in `src/index.tsx` as a MUI theme — it is not driven by env vars.

---

## M1 customisation map

> Context for an LLM picking up this codebase. This section describes what was added or changed relative to the upstream NICE CXone Chat Web SDK sample app.

### Variant wiring

The entry point is `src/Root.tsx`. `REACT_APP_VARIANT=MULTITHREAD` renders `MultiThreadMessenger`, which is effectively the M1 app. `MESSENGER` renders `Messenger → MessengerWindow`, which also uses M1 components.

### MUI theme — `src/index.tsx`

The stock theme is replaced with M1 brand values:

| Token | Value | Use |
|---|---|---|
| `primary.main` | `#ff9e1b` | M1 Orange — buttons, accents |
| `primary.light` | `#ffcc00` | M1 Orange Secondary |
| `primary.dark` | `#ff8800` | Hover states |
| `secondary.main` | `#2873c0` | M1 Blue — links, secondary actions |
| `secondary.dark` | `#144271` | Hover on secondary |
| `background.default` | `#f3f3f8` | Page background |
| `text.primary` | `#333333` | Body text |
| `typography.fontFamily` | Inter | All text |
| `shape.borderRadius` | `18` | Card/button rounding |

### New component directory — `src/M1ChatWidget/`

All M1-specific components live here. None existed in the upstream sample.

| File | What it does |
|---|---|
| `M1ThreadMenu.tsx` | Thread list landing screen. Shows all conversations, "New Conversation" button, inline thread rename (edit icon), archive action. |
| `M1ThreadList.tsx` | Single thread list item component used inside `M1ThreadMenu`. Renders thread name and a "Closed" badge for archived threads. |
| `M1ChatView.tsx` | Active chat screen for the MULTITHREAD variant. Header contains back button, editable thread name, and a dropdown menu (Hot Topics, Popular Questions, Print Messages, Clear Conversation). Wraps the stock `ChatWindow`. |
| `M1ChatWidget.tsx` | Alternative chat widget with header controls: menu (stub), fullscreen toggle, minimize, close. Wraps `M1ChatBody`. Used standalone — not in the current main MULTITHREAD flow. |
| `M1ChatWrapper.tsx` | Thin M1-styled header wrapper around the stock `ChatWindow`. Used by `MessengerWindow` (MESSENGER variant). Title is hardcoded to "Ask Mindy". |
| `M1ChatBody.tsx` | Chat body used inside `M1ChatWidget`. Renders the customer name gate, `MessagesBoard`, and an embedded Hot Topics / Popular Questions intro panel (shown when `messages.size === 0`). Uses `M1SendForm`. |
| `M1SendForm.tsx` | Custom send form with auto-resizing textarea and file upload button. Replaces the stock `SendMessageForm` inside `M1ChatBody`. |
| `useChat.tsx` | Custom React hook encapsulating all chat state for the M1 widget: message list, customer name (persisted to localStorage), agent name, typing indicator, send/file-upload/postback handlers. |
| `M1ChatWidget.css` | Widget chrome styles (header, controls, minimize/fullscreen states). |
| `M1Modern.css` | Modern-theme CSS variables and overrides used across M1 components. |
| `M1ThreadMenu.css` | Layout and styles for the thread list screen. |

### New files in `src/Chat/`

Added alongside existing Chat components — not modifications of upstream files.

| File | What it does |
|---|---|
| `HotTopics/HotTopics.tsx` | Renders a list of M1-branded topic buttons. Topics: "be part of what's next", "Scam Alert: Steps to Take", "Know more about eSIM", "Roam with M1 Daily Passport!", "M1 + SIMBA : an important message". Each fires a pre-written message into the chat on click. |
| `PopularQuestions/PopularQuestions.tsx` | Two M1 FAQ shortcuts: "Transition Your M1 Service with Ease!" and "Billing & Payment for Your Bespoke Plan". Same click-to-send pattern as HotTopics. |
| `MessageItem/QuickReplyOptions.tsx` | M1 orange outlined quick-reply buttons, specifically for M1 Daily Passport options: Daily, Data, Worldwide Roaming, PAYG & RS, Troubleshooting. |

### Modified upstream files

These files existed in the upstream sample and were changed for M1.

| File | Nature of change |
|---|---|
| `src/index.tsx` | MUI theme replaced with M1 brand tokens (see above). |
| `src/index.css` | M1 global CSS additions. |
| `src/M1Theme.css` | New file — M1 CSS custom properties used globally. |
| `src/MultiThreadMessenger/MultiThreadMessenger.tsx` | Near-complete rewrite. Now uses `M1ThreadMenu` for the thread list and `M1ChatView` for the active chat. Adds thread rename, archive, and back-navigation handlers. |
| `src/Messenger/MessengerWindow.tsx` | Renders `M1ChatWrapper` instead of the stock `ChatWindow`. Title hardcoded to "Ask Mindy". |
| `src/Chat/ChatWindow.tsx` | Modified to integrate Hot Topics/Popular Questions panels and handle QR (quick reply) auto-hide logic. |
| `src/Chat/MessagesBoard/MessagesBoard.tsx` | Modified scroll-to-bottom behaviour and message tracking for the M1 intro panel hide/show logic. |
| `src/Chat/SendMessageForm/SendMessageForm.tsx` | Added message autocomplete/suggestions and typing indicator support. |
| `src/Chat/MessageItem/MessageItem.tsx` | M1 visual styles; QR buttons auto-hide after a reply is sent. |
| `src/Chat/MessageItem/MessageText.tsx` | Text rendering adjustments. |
| `src/Chat/Agent/AgentTyping.tsx` | Animated three-dot typing indicator replacing the stock implementation. |
| `src/Chat/Customer/Customer.tsx` | Customer name collection dialog — gates the send form until the user provides a name. Name is persisted to localStorage. |

### Hardcoded content strings

These strings are in source and would need to change for a different brand.

| Location | String |
|---|---|
| `M1ChatWidget.tsx`, `M1ChatWrapper.tsx`, `MessengerWindow.tsx` | Bot title: `"Ask Mindy"` |
| `M1ChatBody.tsx` | Greeting: `"Hello! I'm Mindy, your M1 Chatbot. How can I help you today?"` |
| `HotTopics.tsx` | Five topic labels and their trigger messages |
| `PopularQuestions.tsx` | Two FAQ labels and their trigger messages |
| `M1ChatBody.tsx` | Inline Hot Topics / Popular Questions buttons with their trigger messages (duplicates the component versions for the `M1ChatWidget` flow) |
| `QuickReplyOptions.tsx` | Passport product category labels |
| `MultiThreadMessenger.tsx` | `appName: 'Nice Chat SDK Demo'` passed to SDK options |

### LocalStorage keys

| Key | Set by | Purpose |
|---|---|---|
| `STORAGE_CHAT_CUSTOMER_ID` (constant in `src/constants.ts`) | `MultiThreadMessenger` | Persists the SDK customer ID across sessions |
| `getThreadIdStorageKey(channelId)` | `MultiThreadMessenger` | Remembers the last selected thread ID |
| Customer name key | `useChat.tsx` | Persists the customer display name per session |
