:root {
  --bg: #050807;
  --bg-2: #07110d;

  --panel: #0b1210;
  --panel-2: #0f1915;
  --panel-3: #121f1a;

  --text: #f3f7f4;
  --text-soft: #8ea39a;
  --text-muted: #64746d;

  --primary: #00e676;
  --primary-2: #00c853;
  --primary-soft: rgba(0, 230, 118, .12);
  --primary-border: rgba(0, 230, 118, .35);

  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #38bdf8;

  --border: rgba(255, 255, 255, .08);
  --border-strong: rgba(255, 255, 255, .14);

  --shadow: 0 24px 80px rgba(0, 0, 0, .55);
  --shadow-soft: 0 12px 34px rgba(0, 0, 0, .35);

  --radius-xl: 24px;
  --radius-lg: 18px;
  --radius-md: 14px;

  --nav-height: 82px;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: "Cairo", sans-serif;
  background:
    radial-gradient(circle at 12% 0%, rgba(0, 230, 118, .13), transparent 34%),
    radial-gradient(circle at 88% 10%, rgba(0, 200, 83, .08), transparent 34%),
    linear-gradient(180deg, #050807 0%, #020403 100%);
  color: var(--text);
  overflow: hidden;
}

button,
input,
select,
textarea {
  font-family: inherit;
}

button {
  color: inherit;
}

::selection {
  background: rgba(0, 230, 118, .35);
  color: #fff;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #07100d;
}

::-webkit-scrollbar-thumb {
  background: #1d332a;
  border-radius: 999px;
  border: 2px solid #07100d;
}

::-webkit-scrollbar-thumb:hover {
  background: #285242;
}

/* Main Shell */
.app-shell {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.tablet-shell {
  padding: 0;
}

.app-frame {
  width: 100%;
  height: 100vh;
  background: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Topbar */
.app-topbar {
  min-height: 86px;
  padding: 16px 22px;
  border-bottom: 1px solid var(--border);
  background:
    linear-gradient(90deg, rgba(0, 230, 118, .08), transparent 38%),
    rgba(7, 16, 13, .88);
  backdrop-filter: blur(18px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
}

.app-topbar-copy {
  min-width: 0;
}

.app-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: -.5px;
}

.app-title::after {
  content: " A1";
  color: var(--primary);
  text-shadow: 0 0 18px rgba(0, 230, 118, .35);
}

.app-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-soft);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.order-code-chip {
  background:
    linear-gradient(180deg, rgba(0, 230, 118, .16), rgba(0, 230, 118, .07));
  color: #b8ffd8;
  border: 1px solid var(--primary-border);
  border-radius: 999px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 0 28px rgba(0, 230, 118, .12);
  white-space: nowrap;
}

/* Content */
.app-content {
  flex: 1;
  overflow: auto;
  padding: 18px;
  background:
    radial-gradient(circle at 30% 0%, rgba(0, 230, 118, .055), transparent 32%),
    transparent;
}

.screen {
  display: none;
}

.active-screen {
  display: block;
}

/* Dashboard */
.dashboard-hero {
  display: grid;
  gap: 14px;
  margin-bottom: 18px;
}

.dashboard-title-card {
  background:
    radial-gradient(circle at 12% 0%, rgba(0, 230, 118, .18), transparent 34%),
    radial-gradient(circle at 92% 20%, rgba(255, 255, 255, .08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, .055), rgba(255, 255, 255, .018)),
    #07100d;
  border: 1px solid rgba(0, 230, 118, .18);
  border-radius: var(--radius-xl);
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  position: relative;
}

.dashboard-title-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(0, 230, 118, .10), transparent 45%),
    repeating-linear-gradient(
      135deg,
      rgba(255, 255, 255, .025) 0,
      rgba(255, 255, 255, .025) 1px,
      transparent 1px,
      transparent 12px
    );
  opacity: .8;
}

.dashboard-title-card > * {
  position: relative;
  z-index: 1;
}

.dashboard-eyebrow {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  color: #b8ffd8;
  background: rgba(0, 230, 118, .10);
  border: 1px solid rgba(0, 230, 118, .22);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .4px;
  margin-bottom: 8px;
}

.dashboard-title-card h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.25;
  font-weight: 950;
  letter-spacing: -.5px;
}

.dashboard-title-card p {
  margin: 6px 0 0;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.7;
}

.dashboard-printer-pill {
  min-width: 240px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, .045);
  border: 1px solid rgba(255, 255, 255, .09);
  border-radius: 999px;
  padding: 11px 14px;
}

.printer-dot {
  width: 13px;
  height: 13px;
  border-radius: 999px;
  background: var(--primary);
  box-shadow: 0 0 20px rgba(0, 230, 118, .75);
  flex-shrink: 0;
}

.printer-dot-warning {
  background: var(--warning);
  box-shadow: 0 0 20px rgba(245, 158, 11, .75);
}

.printer-dot-danger {
  background: var(--danger);
  box-shadow: 0 0 20px rgba(239, 68, 68, .75);
}

.dashboard-printer-pill strong {
  display: block;
  font-size: 13px;
  font-weight: 950;
}

.dashboard-printer-pill small {
  display: block;
  margin-top: 2px;
  color: var(--text-soft);
  font-size: 11px;
  font-weight: 800;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.dashboard-grid-pro {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.dash-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .045), rgba(255, 255, 255, .018)),
    #0b1210;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 14px;
  min-height: 122px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .24);
  position: relative;
  overflow: hidden;
  text-align: right;
}

button.dash-card {
  cursor: pointer;
}

.dash-card-clickable {
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}

.dash-card-clickable:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 230, 118, .26);
  box-shadow: 0 16px 38px rgba(0, 0, 0, .32);
}

.dash-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at top left, rgba(0, 230, 118, .10), transparent 42%),
    radial-gradient(circle at bottom right, rgba(255, 255, 255, .045), transparent 34%);
  opacity: .85;
}

.dash-card > * {
  position: relative;
  z-index: 1;
}

.dash-label {
  display: block;
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 900;
}

.dash-card strong {
  display: block;
  margin-top: 6px;
  color: #f4fff8;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 950;
  letter-spacing: -.4px;
}

.dash-card small {
  display: block;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.5;
}

.dash-card-profit {
  border-color: rgba(0, 230, 118, .18);
}

.dash-card-profit strong {
  color: var(--primary);
  text-shadow: 0 0 18px rgba(0, 230, 118, .20);
}

.dash-card-warning {
  border-color: rgba(245, 158, 11, .18);
}

.dash-card-warning strong {
  color: #ffd892;
}

.quick-actions-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.quick-action-btn {
  min-height: 44px;
  border: 1px solid rgba(0, 230, 118, .18);
  background:
    linear-gradient(180deg, rgba(0, 230, 118, .09), rgba(255, 255, 255, .025)),
    #07100d;
  color: #d9ffe9;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: .18s ease;
}

.quick-action-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 230, 118, .35);
  background:
    linear-gradient(180deg, rgba(0, 230, 118, .15), rgba(255, 255, 255, .035)),
    #07100d;
}

/* Layout Grids */
.home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr);
  gap: 16px;
  align-items: stretch;
}

.top-grid,
.bottom-grid {
  width: 100%;
}

.grid-2,
.grid-3,
.compact-grid {
  display: grid;
  gap: 12px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3,
.compact-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.top-grid .compact-grid,
.bottom-grid .compact-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.section-gap-sm {
  margin-top: 12px;
}

.section-gap-md {
  margin-top: 16px;
}

.section-gap-lg {
  margin-top: 18px;
}

/* Cards */
.card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .045), rgba(255, 255, 255, .018)),
    var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 16px;
  box-shadow: var(--shadow-soft);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(120deg, rgba(0, 230, 118, .08), transparent 28%),
    radial-gradient(circle at 100% 0%, rgba(255, 255, 255, .06), transparent 24%);
  opacity: .75;
}

.card > * {
  position: relative;
  z-index: 1;
}

.compact-card {
  padding: 16px;
}

.equal-card {
  min-height: 100%;
}

/* Section Headers */
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.section-head h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -.2px;
}

.section-subtext {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-soft);
}

.section-head-light h3 {
  color: #f4fff8;
}

.light-text {
  color: rgba(216, 255, 233, .75);
}

.section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid var(--border);
}

.section-badge-light {
  color: #b8ffd8;
  background: rgba(0, 230, 118, .12);
  border-color: rgba(0, 230, 118, .25);
}

/* Forms */
.form-group {
  min-width: 0;
}

.form-group label {
  display: block;
  margin-bottom: 7px;
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .035), rgba(255, 255, 255, .015)),
    #07100d;
  color: #fff;
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}

input,
select {
  height: 46px;
}

textarea {
  min-height: 110px;
  resize: vertical;
}

input::placeholder,
textarea::placeholder {
  color: rgba(142, 163, 154, .7);
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--primary-border);
  box-shadow: 0 0 0 4px rgba(0, 230, 118, .10);
  background:
    linear-gradient(180deg, rgba(0, 230, 118, .055), rgba(255, 255, 255, .015)),
    #07100d;
}

input[readonly] {
  opacity: .8;
  cursor: not-allowed;
}

/* Mini Sections */
.compact-section-block {
  background: rgba(255, 255, 255, .025);
  border: 1px solid rgba(255, 255, 255, .065);
  border-radius: var(--radius-lg);
  padding: 14px;
}

.fill-block {
  min-height: 222px;
}

.mini-section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.mini-section-head h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 900;
}

.mini-section-head span {
  color: var(--text-soft);
  font-size: 12px;
}

/* Notes */
.field-note {
  background: rgba(0, 230, 118, .07);
  color: #c9ffe0;
  border: 1px solid rgba(0, 230, 118, .14);
  border-radius: var(--radius-md);
  padding: 11px 13px;
  font-size: 13px;
  line-height: 1.7;
}

/* Buttons */
.btn {
  border: 1px solid transparent;
  cursor: pointer;
  min-height: 44px;
  border-radius: var(--radius-md);
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 900;
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
  user-select: none;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0) scale(.99);
}

.btn-primary {
  background: linear-gradient(180deg, #15f58a, #00b85c);
  color: #03100a;
  border-color: rgba(255, 255, 255, .12);
  box-shadow: 0 14px 30px rgba(0, 230, 118, .20);
}

.btn-primary:hover {
  box-shadow: 0 18px 42px rgba(0, 230, 118, .28);
}

.btn-secondary {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .075), rgba(255, 255, 255, .035));
  color: #e8f5ee;
  border: 1px solid var(--border-strong);
}

.btn-secondary:hover {
  border-color: rgba(0, 230, 118, .32);
  background:
    linear-gradient(180deg, rgba(0, 230, 118, .10), rgba(255, 255, 255, .035));
}

.btn-danger {
  background: linear-gradient(180deg, #ff5a5a, #dc2626);
  color: #fff;
  box-shadow: 0 14px 30px rgba(239, 68, 68, .20);
}

.btn-save {
  width: 100%;
  background: linear-gradient(180deg, #15f58a, #00b85c);
  color: #03100a;
  min-height: 54px;
  font-size: 16px;
  border: 1px solid rgba(255, 255, 255, .12);
  box-shadow: 0 18px 45px rgba(0, 230, 118, .22);
}

.btn-small {
  min-height: 36px;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.btn-auto {
  width: auto;
  min-width: 92px;
}

.inline-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Result Card */
.result-card {
  background:
    radial-gradient(circle at top right, rgba(0, 230, 118, .18), transparent 38%),
    linear-gradient(180deg, #07100d, #0b1210);
  border-color: rgba(0, 230, 118, .16);
}

.compact-result-card {
  padding: 16px;
}

.summary-card {
  position: sticky;
  top: 0;
  align-self: start;
}

.summary-main {
  display: grid;
  gap: 10px;
}

.summary-stat {
  padding: 13px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, .035);
  border: 1px solid rgba(255, 255, 255, .07);
}

.summary-label {
  display: block;
  font-size: 12px;
  color: var(--text-soft);
  font-weight: 800;
}

.summary-value {
  display: block;
  margin-top: 3px;
  font-size: 27px;
  line-height: 1.15;
  font-weight: 950;
  letter-spacing: -.5px;
}

.summary-stat:nth-child(2) .summary-value {
  color: var(--primary);
  text-shadow: 0 0 22px rgba(0, 230, 118, .24);
}

.final-price-box {
  margin-top: 14px;
}

/* Bottom Nav */
.bottom-nav {
  height: var(--nav-height);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .04), rgba(255, 255, 255, .015)),
    rgba(7, 16, 13, .94);
  backdrop-filter: blur(18px);
  border-top: 1px solid var(--border);
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  padding: 10px;
  gap: 8px;
  flex-shrink: 0;
}

.nav-btn {
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-soft);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 900;
  transition: .18s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, .045);
  color: #dcece4;
}

.nav-btn-active {
  background: var(--primary-soft);
  color: #b8ffd8;
  border-color: rgba(0, 230, 118, .22);
  box-shadow: inset 0 0 0 1px rgba(0, 230, 118, .08), 0 10px 24px rgba(0, 0, 0, .18);
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
}

.nav-icon svg {
  width: 24px;
  height: 24px;
}

/* Tables */
.table-wrap {
  background: #07100d;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: auto;
  max-height: 460px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #0e1a15;
  color: #dff7ea;
  padding: 12px 10px;
  font-size: 12px;
  text-align: start;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

tbody td {
  padding: 11px 10px;
  color: #c8d8d0;
  border-bottom: 1px solid rgba(255, 255, 255, .06);
  font-size: 13px;
  white-space: nowrap;
}

tbody tr {
  transition: background .16s ease;
}

tbody tr:hover {
  background: rgba(0, 230, 118, .055);
}

/* Modal Panels */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .76);
  display: none;
  z-index: 999;
  backdrop-filter: blur(10px);
}

.modal-content {
  width: min(1180px, calc(100% - 28px));
  height: min(860px, calc(100% - 28px));
  margin: 14px auto;
  background:
    radial-gradient(circle at top right, rgba(0, 230, 118, .10), transparent 34%),
    #0b1210;
  border: 1px solid var(--border-strong);
  border-radius: 26px;
  padding: 20px;
  overflow: auto;
  box-shadow: var(--shadow);
}

.modal-xl {
  width: min(1420px, calc(100% - 28px));
}

.modal-lg {
  width: min(980px, calc(100% - 28px));
}

.modal-md {
  width: min(760px, calc(100% - 28px));
}

.panel-content {
  display: block;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.panel-head h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -.3px;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stats-grid-pro {
  grid-template-columns: repeat(8, minmax(0, 1fr));
}

.stat-box,
.mini-kpi {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .045), rgba(255, 255, 255, .02));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px;
}

.stat-box h4,
.mini-kpi span {
  margin: 0 0 8px;
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 800;
}

.stat-box div,
.mini-kpi strong {
  display: block;
  color: #f3fff8;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 950;
}

.stat-box:nth-child(1) div,
.stat-box:nth-child(2) div,
.mini-kpi strong {
  color: var(--primary);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 220px));
  gap: 12px;
}

/* Toolbar */
.toolbar {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-wrap {
  align-items: end;
}

/* Lists */
.stack-list {
  display: grid;
  gap: 12px;
}

.stack-list > * {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .045), rgba(255, 255, 255, .018));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px;
}

/* Pipeline */
.pipeline-board {
  display: grid;
  grid-template-columns: repeat(5, minmax(260px, 1fr));
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  min-height: 520px;
}

.pipeline-column {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .035), rgba(255, 255, 255, .015)),
    rgba(7, 16, 13, .88);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 12px;
  min-width: 260px;
}

.pipeline-column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, .07);
}

.pipeline-column-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 950;
}

.pipeline-column-head span {
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(0, 230, 118, .10);
  color: #b8ffd8;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-weight: 950;
  border: 1px solid rgba(0, 230, 118, .18);
}

.pipeline-list {
  display: grid;
  gap: 10px;
  align-content: start;
}

.pipeline-card {
  background:
    radial-gradient(circle at top right, rgba(0, 230, 118, .09), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, .055), rgba(255, 255, 255, .02)),
    #0b1210;
  border: 1px solid rgba(255, 255, 255, .09);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, .22);
}

.pipeline-card-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.pipeline-code {
  color: #b8ffd8;
  font-weight: 950;
  font-size: 13px;
}

.pipeline-title {
  display: block;
  margin-top: 4px;
  font-weight: 950;
  color: #f4fff8;
  font-size: 14px;
  line-height: 1.5;
}

.pipeline-meta {
  display: grid;
  gap: 4px;
  color: var(--text-soft);
  font-size: 12px;
  line-height: 1.5;
}

.pipeline-price {
  margin-top: 8px;
  display: grid;
  gap: 4px;
  font-size: 12px;
  color: #c8d8d0;
}

.pipeline-price strong {
  color: var(--primary);
  font-size: 15px;
}

.pipeline-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.pipeline-actions .action-btn {
  margin: 0;
  padding: 6px 8px;
}

.status-step-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.status-step-btn {
  border: 1px solid rgba(255, 255, 255, .10);
  background: rgba(255, 255, 255, .045);
  color: #dcece4;
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.status-step-btn:hover {
  background: rgba(0, 230, 118, .10);
  border-color: rgba(0, 230, 118, .28);
}

/* Toast */
.toast {
  position: fixed;
  top: 18px;
  left: 18px;
  z-index: 2000;
  max-width: 420px;
  background:
    linear-gradient(180deg, rgba(0, 230, 118, .18), rgba(0, 230, 118, .09)),
    #07100d;
  color: #d9ffe9;
  border: 1px solid rgba(0, 230, 118, .32);
  box-shadow: 0 18px 60px rgba(0, 0, 0, .5);
  border-radius: 16px;
  padding: 13px 16px;
  font-size: 14px;
  font-weight: 800;
  transition: .25s ease;
}

.toast.error {
  background:
    linear-gradient(180deg, rgba(239, 68, 68, .18), rgba(239, 68, 68, .08)),
    #120707;
  color: #ffd6d6;
  border-color: rgba(239, 68, 68, .35);
}

/* List Cards */
.list-card,
.stock-item {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .045), rgba(255, 255, 255, .018)),
    #0b1210;
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 18px;
  padding: 14px;
}

.list-card-head,
.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.list-card-head strong,
.stock-header span:first-child {
  font-size: 16px;
  font-weight: 950;
}

.list-card-body,
.stock-details {
  display: grid;
  gap: 7px;
  color: #9fb2aa;
  font-size: 13px;
  line-height: 1.6;
}

.card-actions {
  margin-top: 12px;
}

/* Stock Progress */
.stock-bar {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, .07);
  border-radius: 999px;
  overflow: hidden;
  margin: 10px 0 12px;
}

.stock-progress {
  height: 100%;
  background: linear-gradient(90deg, #00c853, #15f58a);
  border-radius: 999px;
  box-shadow: 0 0 18px rgba(0, 230, 118, .28);
}

.stock-item.low {
  border-color: rgba(245, 158, 11, .30);
}

.stock-item.low .stock-progress {
  background: linear-gradient(90deg, #ef4444, #f59e0b);
}

/* Badges */
.badge,
.status-chip,
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 900;
  background: rgba(255, 255, 255, .06);
  color: #dcece4;
  border: 1px solid rgba(255, 255, 255, .08);
  white-space: nowrap;
}

.badge-success,
.status-success {
  background: rgba(34, 197, 94, .14);
  color: #9fffc4;
  border-color: rgba(34, 197, 94, .28);
}

.badge-warning,
.status-warning {
  background: rgba(245, 158, 11, .14);
  color: #ffd892;
  border-color: rgba(245, 158, 11, .28);
}

.badge-danger,
.status-danger {
  background: rgba(239, 68, 68, .14);
  color: #ffb4b4;
  border-color: rgba(239, 68, 68, .28);
}

/* Table Action Buttons */
.action-btn {
  border: 1px solid rgba(255, 255, 255, .10);
  background: rgba(255, 255, 255, .05);
  color: #e8f5ee;
  border-radius: 10px;
  padding: 7px 10px;
  margin: 2px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 900;
}

.action-btn:hover {
  border-color: rgba(0, 230, 118, .35);
  background: rgba(0, 230, 118, .10);
}

.action-btn.delete {
  color: #ffb4b4;
}

.action-btn.delete:hover {
  border-color: rgba(239, 68, 68, .35);
  background: rgba(239, 68, 68, .12);
}

/* Invoice */
.invoice-sheet {
  background: #ffffff;
  color: #111827;
  border-radius: 18px;
  padding: 28px;
  max-width: 820px;
  margin: 0 auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, .24);
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 18px;
  margin-bottom: 20px;
}

.invoice-brand h1 {
  margin: 0;
  font-size: 28px;
  color: #111827;
}

.invoice-brand p,
.invoice-meta p {
  margin: 5px 0;
  color: #4b5563;
  font-size: 14px;
}

.invoice-badge {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  padding: 7px 12px;
  color: #065f46;
  background: #d1fae5;
  font-weight: 900;
  font-size: 12px;
}

.invoice-section {
  margin-top: 20px;
}

.invoice-section h3 {
  margin: 0 0 10px;
  color: #111827;
  font-size: 16px;
}

.invoice-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.invoice-box {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 14px;
  padding: 12px;
}

.invoice-box span {
  display: block;
  color: #6b7280;
  font-size: 12px;
  margin-bottom: 4px;
}

.invoice-box strong {
  display: block;
  color: #111827;
  font-size: 16px;
}

.invoice-total {
  margin-top: 22px;
  border-radius: 18px;
  background: #111827;
  color: #fff;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}

.invoice-total span {
  color: #d1d5db;
  font-size: 13px;
}

.invoice-total strong {
  color: #86efac;
  font-size: 30px;
}

.invoice-notes {
  margin-top: 20px;
  color: #4b5563;
  background: #f3f4f6;
  border-radius: 14px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.7;
}

/* Preset */
.preset-card {
  background:
    radial-gradient(circle at top right, rgba(0, 230, 118, .13), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, .045), rgba(255, 255, 255, .018)),
    #0b1210;
  border: 1px solid rgba(0, 230, 118, .16);
  border-radius: var(--radius-xl);
  padding: 18px;
}

.preset-card h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 950;
}

.preset-card p {
  margin: 0;
  color: var(--text-soft);
  line-height: 1.8;
  font-size: 14px;
}

/* Empty State */
.empty-state {
  text-align: center;
  color: #8ea39a;
  padding: 18px;
  font-size: 14px;
  font-weight: 800;
}

/* Import Button */
.import-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Utilities */
.hidden {
  display: none !important;
}

.muted {
  color: var(--text-soft);
}

.text-success {
  color: var(--success);
}

.text-danger {
  color: var(--danger);
}

.text-warning {
  color: var(--warning);
}

.no-print {
  display: flex;
}

/* Responsive */
@media (max-width: 1500px) {
  .dashboard-grid-pro {
    grid-template-columns: repeat(4, 1fr);
  }

  .stats-grid-pro {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1360px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .quick-actions-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1180px) {
  .home-grid {
    grid-template-columns: 1fr;
  }

  .summary-card {
    position: relative;
    top: auto;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .stats-grid-pro {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-title-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-printer-pill {
    width: 100%;
    min-width: 0;
  }

  .topbar-actions {
    justify-content: flex-start;
  }

  .app-topbar {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 820px) {
  html,
  body {
    overflow: auto;
  }

  .app-shell,
  .app-frame {
    min-height: 100vh;
    height: auto;
    overflow: visible;
  }

  .app-content {
    overflow: visible;
  }

  .grid-2,
  .grid-3,
  .compact-grid,
  .top-grid .compact-grid,
  .bottom-grid .compact-grid {
    grid-template-columns: 1fr;
  }

  .bottom-nav {
    grid-template-columns: repeat(3, 1fr);
    height: auto;
  }

  .stats-grid,
  .stats-grid-pro {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar {
    grid-template-columns: 1fr;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .panel-head {
    align-items: stretch;
    flex-direction: column;
  }

  .btn-auto {
    width: 100%;
  }

  .dashboard-grid,
  .dashboard-grid-pro {
    grid-template-columns: repeat(2, 1fr);
  }

  .quick-actions-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .invoice-header,
  .invoice-total {
    flex-direction: column;
    align-items: stretch;
  }

  .invoice-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .app-title {
    font-size: 24px;
  }

  .app-content {
    padding: 12px;
  }

  .card {
    border-radius: 18px;
    padding: 14px;
  }

  .modal-content {
    width: calc(100% - 16px);
    height: calc(100% - 16px);
    margin: 8px;
    border-radius: 18px;
  }

  .stats-grid,
  .stats-grid-pro,
  .dashboard-grid,
  .dashboard-grid-pro,
  .quick-actions-row {
    grid-template-columns: 1fr;
  }

  .dashboard-title-card h2 {
    font-size: 21px;
  }

  .invoice-sheet {
    padding: 18px;
  }
}

/* Print */
@media print {
  html,
  body {
    background: #fff !important;
    color: #111827 !important;
    overflow: visible !important;
  }

  body * {
    visibility: hidden;
  }

  #invoiceContent,
  #invoiceContent * {
    visibility: visible;
  }

  #invoiceContent {
    position: absolute;
    inset: 0;
    width: 100%;
  }

  .no-print,
  .bottom-nav,
  .app-topbar {
    display: none !important;
  }

  .modal {
    position: static !important;
    display: block !important;
    background: #fff !important;
    backdrop-filter: none !important;
  }

  .modal-content {
    width: 100% !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    background: #fff !important;
    overflow: visible !important;
  }

  .invoice-sheet {
    box-shadow: none !important;
    border-radius: 0 !important;
    max-width: none !important;
  }
}
