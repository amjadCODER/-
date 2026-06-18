const USERS = {
  "001": "manager",
  "002": "employee",
};

const BRANCHES = [
  { key: "hail-zone", label: "حائل زون" },
  { key: "riyadh", label: "الرياض" },
  { key: "jeddah", label: "جدة" },
  { key: "dammam", label: "الدمام" },
];

const TICKETS = [
  { key: "electricBungee", label: "البانج الكهربائية" },
  { key: "boxingChallenge", label: "تحدي البوكسنج" },
  { key: "reactionGame", label: "ردة الفعل" },
  { key: "photoBooth", label: "بوث التصوير" },
];

const STORAGE_KEY = "khaled-askar-branch-income-entries";
const state = {
  currentRole: null,
  selectedBranch: BRANCHES[0].key,
  counters: Object.fromEntries(TICKETS.map((ticket) => [ticket.key, 0])),
};

const els = {
  loginView: document.querySelector("#loginView"),
  managerView: document.querySelector("#managerView"),
  employeeView: document.querySelector("#employeeView"),
  loginForm: document.querySelector("#loginForm"),
  loginError: document.querySelector("#loginError"),
  loginBranch: document.querySelector("#loginBranch"),
  userCode: document.querySelector("#userCode"),
  entryForm: document.querySelector("#entryForm"),
  employeeBranch: document.querySelector("#employeeBranch"),
  employeeTitle: document.querySelector("#employeeTitle"),
  employeeName: document.querySelector("#employeeName"),
  cashAmount: document.querySelector("#cashAmount"),
  networkAmount: document.querySelector("#networkAmount"),
  totalAmount: document.querySelector("#totalAmount"),
  purchases: document.querySelector("#purchases"),
  employeeDate: document.querySelector("#employeeDate"),
  ticketCounters: document.querySelector("#ticketCounters"),
  employeeEntriesBody: document.querySelector("#employeeEntriesBody"),
  employeeDownloadMonthlyReport: document.querySelector("#employeeDownloadMonthlyReport"),
  saveStatus: document.querySelector("#saveStatus"),
  managerBranch: document.querySelector("#managerBranch"),
  managerBranchName: document.querySelector("#managerBranchName"),
  managerDate: document.querySelector("#managerDate"),
  managerEmployee: document.querySelector("#managerEmployee"),
  managerTotal: document.querySelector("#managerTotal"),
  managerCash: document.querySelector("#managerCash"),
  managerNetwork: document.querySelector("#managerNetwork"),
  managerTickets: document.querySelector("#managerTickets"),
  managerSavedAt: document.querySelector("#managerSavedAt"),
  managerPurchases: document.querySelector("#managerPurchases"),
  monthlyReportMeta: document.querySelector("#monthlyReportMeta"),
  monthlyReportTotals: document.querySelector("#monthlyReportTotals"),
  monthlyReportBody: document.querySelector("#monthlyReportBody"),
  downloadMonthlyReport: document.querySelector("#downloadMonthlyReport"),
};

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(date = new Date()) {
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "full",
    calendar: "gregory",
  }).format(date);
}

function displayTime(date = new Date()) {
  return new Intl.DateTimeFormat("ar-SA", {
    timeStyle: "short",
  }).format(date);
}

function money(value) {
  return Number(value || 0).toLocaleString("ar-SA", {
    maximumFractionDigits: 0,
  });
}

function wholeNumber(value) {
  return Math.max(0, Math.trunc(Number(value) || 0));
}

function cleanMoneyInput(input, forceZero = false) {
  if (input.value === "") {
    if (forceZero) input.value = "0";
    return;
  }

  const cleaned = input.value.replace(/[^\d]/g, "");
  input.value = cleaned === "" ? (forceZero ? "0" : "") : String(Number(cleaned));
}

function branchLabel(key = state.selectedBranch) {
  return BRANCHES.find((branch) => branch.key === key)?.label || BRANCHES[0].label;
}

function entryKey(branchKey = state.selectedBranch) {
  return `${branchKey}:${todayKey()}`;
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveEntry(entry) {
  const entries = loadEntries();
  entries[entry.storageKey] = entry;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function deleteEntry(storageKey) {
  const entries = loadEntries();
  delete entries[storageKey];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function todayEntry(branchKey = state.selectedBranch) {
  return loadEntries()[entryKey(branchKey)] || null;
}

function currentMonthKey() {
  return todayKey().slice(0, 7);
}

function monthlyEntries(branchKey = state.selectedBranch) {
  const monthKey = currentMonthKey();
  return Object.values(loadEntries())
    .filter((entry) => entry.branchKey === branchKey && entry.dateKey?.startsWith(monthKey))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

function ticketSum(entry) {
  return TICKETS.reduce((sum, ticket) => sum + Number(entry.tickets?.[ticket.key] || 0), 0);
}

function monthName() {
  return new Intl.DateTimeFormat("ar-SA", {
    month: "long",
    year: "numeric",
    calendar: "gregory",
  }).format(new Date());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fillBranchSelects() {
  const options = BRANCHES.map((branch) => `<option value="${branch.key}">${branch.label}</option>`).join("");
  [els.loginBranch, els.managerBranch, els.employeeBranch].forEach((select) => {
    select.innerHTML = options;
    select.value = state.selectedBranch;
  });
}

function syncBranchSelects() {
  [els.loginBranch, els.managerBranch, els.employeeBranch].forEach((select) => {
    select.value = state.selectedBranch;
  });
}

function showView(view) {
  els.loginView.classList.add("hidden");
  els.managerView.classList.add("hidden");
  els.employeeView.classList.add("hidden");
  view.classList.remove("hidden");
}

function resetEmployeeForm() {
  const entry = todayEntry();
  state.counters = Object.fromEntries(
    TICKETS.map((ticket) => [ticket.key, Number(entry?.tickets?.[ticket.key] || 0)]),
  );

  els.employeeTitle.textContent = `فرع ${branchLabel()}`;
  els.employeeDate.textContent = displayDate();
  els.employeeName.value = entry?.employeeName || "";
  els.cashAmount.value = entry?.cash || 0;
  els.networkAmount.value = entry?.network || 0;
  els.purchases.value = entry?.purchases || "";
  renderCounters();
  updateTotal();
  renderEmployeeEntries();
  els.saveStatus.textContent = entry ? "تم تحميل بيانات اليوم المحفوظة لهذا الفرع." : "";
}

function renderCounters() {
  els.ticketCounters.innerHTML = TICKETS.map((ticket) => {
    const value = state.counters[ticket.key] || 0;
    return `
      <article class="counter-item">
        <span>${ticket.label}</span>
        <div class="counter-control">
          <button type="button" data-counter="${ticket.key}" data-step="-1" aria-label="إنقاص ${ticket.label}">-</button>
          <input type="number" min="0" value="${value}" data-input="${ticket.key}" aria-label="${ticket.label}" readonly />
          <button type="button" data-counter="${ticket.key}" data-step="1" aria-label="زيادة ${ticket.label}">+</button>
        </div>
      </article>
    `;
  }).join("");
}

function updateTotal() {
  const total = wholeNumber(els.cashAmount.value) + wholeNumber(els.networkAmount.value);
  els.totalAmount.value = money(total);
}

function renderManager() {
  const entry = todayEntry();
  els.managerDate.textContent = displayDate();
  els.managerBranchName.textContent = branchLabel();

  if (!entry) {
    els.managerEmployee.textContent = "لم يتم الإدخال";
    els.managerTotal.textContent = "0";
    els.managerCash.textContent = "0";
    els.managerNetwork.textContent = "0";
    els.managerSavedAt.textContent = "لا توجد بيانات محفوظة لهذا الفرع اليوم";
    els.managerPurchases.textContent = "لا توجد مشتريات مسجلة.";
    els.managerTickets.innerHTML = TICKETS.map((ticket) => `
      <article class="ticket-item">
        <span>${ticket.label}</span>
        <strong>0</strong>
      </article>
    `).join("");
    renderMonthlyReport();
    return;
  }

  els.managerEmployee.textContent = entry.employeeName || "غير محدد";
  els.managerCash.textContent = money(entry.cash);
  els.managerNetwork.textContent = money(entry.network);
  els.managerTotal.textContent = money(Number(entry.cash) + Number(entry.network));
  els.managerSavedAt.textContent = `آخر حفظ: ${entry.dateDisplay} - ${entry.savedAtDisplay}`;
  els.managerPurchases.textContent = entry.purchases?.trim() || "لا توجد مشتريات مسجلة.";
  els.managerTickets.innerHTML = TICKETS.map((ticket) => `
    <article class="ticket-item">
      <span>${ticket.label}</span>
      <strong>${Number(entry.tickets?.[ticket.key] || 0).toLocaleString("ar-SA")}</strong>
    </article>
  `).join("");
  renderMonthlyReport();
}

function renderMonthlyReport() {
  const entries = monthlyEntries();
  const totals = entries.reduce((acc, entry) => {
    acc.cash += Number(entry.cash || 0);
    acc.network += Number(entry.network || 0);
    acc.tickets += ticketSum(entry);
    return acc;
  }, { cash: 0, network: 0, tickets: 0 });

  els.monthlyReportMeta.textContent = `تقرير ${monthName()} - فرع ${branchLabel()}`;
  els.monthlyReportTotals.innerHTML = `
    <article class="report-total"><span>إجمالي الكاش</span><strong>${money(totals.cash)}</strong></article>
    <article class="report-total"><span>إجمالي الشبكة</span><strong>${money(totals.network)}</strong></article>
    <article class="report-total"><span>إجمالي الدخل</span><strong>${money(totals.cash + totals.network)}</strong></article>
    <article class="report-total"><span>إجمالي التذاكر</span><strong>${totals.tickets.toLocaleString("ar-SA")}</strong></article>
  `;

  if (!entries.length) {
    els.monthlyReportBody.innerHTML = '<tr><td class="empty-report" colspan="12">لا توجد إدخالات محفوظة لهذا الشهر.</td></tr>';
    return;
  }

  els.monthlyReportBody.innerHTML = entries.map((entry) => `
    <tr>
      <td>${escapeHtml(entry.dateDisplay || entry.dateKey)}</td>
      <td>${escapeHtml(entry.employeeName || "غير محدد")}</td>
      <td>${money(entry.cash)}</td>
      <td>${money(entry.network)}</td>
      <td>${money(Number(entry.cash) + Number(entry.network))}</td>
      ${TICKETS.map((ticket) => `<td>${Number(entry.tickets?.[ticket.key] || 0).toLocaleString("ar-SA")}</td>`).join("")}
      <td>${ticketSum(entry).toLocaleString("ar-SA")}</td>
      <td>${escapeHtml(entry.purchases?.trim() || "لا توجد")}</td>
      <td><button class="danger-button" type="button" data-delete-entry="${escapeHtml(entry.storageKey)}">حذف</button></td>
    </tr>
  `).join("");
}

function renderEmployeeEntries() {
  const entries = monthlyEntries();

  if (!entries.length) {
    els.employeeEntriesBody.innerHTML = '<tr><td class="empty-report" colspan="8">لا توجد إدخالات محفوظة لهذا الشهر.</td></tr>';
    return;
  }

  els.employeeEntriesBody.innerHTML = entries.map((entry) => `
    <tr>
      <td>${escapeHtml(entry.dateDisplay || entry.dateKey)}</td>
      <td>${escapeHtml(entry.employeeName || "غير محدد")}</td>
      <td>${money(entry.cash)}</td>
      <td>${money(entry.network)}</td>
      <td>${money(Number(entry.cash) + Number(entry.network))}</td>
      <td>${ticketSum(entry).toLocaleString("ar-SA")}</td>
      <td>${escapeHtml(entry.purchases?.trim() || "لا توجد")}</td>
      <td><button class="danger-button" type="button" data-delete-entry="${escapeHtml(entry.storageKey)}">حذف</button></td>
    </tr>
  `).join("");
}

function downloadMonthlyReport() {
  const entries = monthlyEntries();
  const totals = entries.reduce((acc, entry) => {
    acc.cash += wholeNumber(entry.cash);
    acc.network += wholeNumber(entry.network);
    acc.tickets += ticketSum(entry);
    TICKETS.forEach((ticket) => {
      acc[ticket.key] += Number(entry.tickets?.[ticket.key] || 0);
    });
    return acc;
  }, { cash: 0, network: 0, tickets: 0, ...Object.fromEntries(TICKETS.map((ticket) => [ticket.key, 0])) });

  const detailRows = entries.map((entry) => `
    <tr>
      <td>${escapeHtml(entry.dateDisplay || entry.dateKey)}</td>
      <td>${escapeHtml(entry.branch || branchLabel())}</td>
      <td>${escapeHtml(entry.employeeName || "")}</td>
      <td>${wholeNumber(entry.cash)}</td>
      <td>${wholeNumber(entry.network)}</td>
      <td>${wholeNumber(entry.cash) + wholeNumber(entry.network)}</td>
      ${TICKETS.map((ticket) => `<td>${Number(entry.tickets?.[ticket.key] || 0)}</td>`).join("")}
      <td>${ticketSum(entry)}</td>
      <td>${escapeHtml(entry.purchases || "")}</td>
    </tr>
  `).join("");

  const excelHtml = `
    <html dir="rtl">
      <head><meta charset="UTF-8" /></head>
      <body>
        <h2>تقرير ${escapeHtml(monthName())}</h2>
        <p>الفرع: ${escapeHtml(branchLabel())}</p>
        <table border="1">
          <tr>
            <th>إجمالي الكاش</th>
            <th>إجمالي الشبكة</th>
            <th>إجمالي الدخل</th>
            ${TICKETS.map((ticket) => `<th>إجمالي ${escapeHtml(ticket.label)}</th>`).join("")}
            <th>إجمالي التذاكر</th>
          </tr>
          <tr>
            <td>${totals.cash}</td>
            <td>${totals.network}</td>
            <td>${totals.cash + totals.network}</td>
            ${TICKETS.map((ticket) => `<td>${totals[ticket.key]}</td>`).join("")}
            <td>${totals.tickets}</td>
          </tr>
        </table>
        <br />
        <table border="1">
          <tr>
            <th>التاريخ</th>
            <th>الفرع</th>
            <th>الموظف</th>
            <th>الكاش</th>
            <th>الشبكة</th>
            <th>الإجمالي</th>
            ${TICKETS.map((ticket) => `<th>${escapeHtml(ticket.label)}</th>`).join("")}
            <th>إجمالي التذاكر</th>
            <th>المشتريات</th>
          </tr>
          ${detailRows || '<tr><td colspan="12">لا توجد بيانات لهذا الشهر</td></tr>'}
        </table>
      </body>
    </html>
  `;
  const blob = new Blob(["\ufeff", excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `تقرير-${branchLabel()}-${currentMonthKey()}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

function changeBranch(branchKey) {
  state.selectedBranch = branchKey;
  syncBranchSelects();

  if (state.currentRole === "manager") {
    renderManager();
  }

  if (state.currentRole === "employee") {
    resetEmployeeForm();
  }
}

els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = els.userCode.value.trim();
  const role = USERS[code];

  if (!role) {
    els.loginError.textContent = "رقم المستخدم غير صحيح.";
    return;
  }

  els.loginError.textContent = "";
  state.currentRole = role;
  state.selectedBranch = els.loginBranch.value;
  syncBranchSelects();
  els.userCode.value = "";

  if (role === "manager") {
    renderManager();
    showView(els.managerView);
  } else {
    resetEmployeeForm();
    showView(els.employeeView);
  }
});

els.loginBranch.addEventListener("change", (event) => changeBranch(event.target.value));
els.managerBranch.addEventListener("change", (event) => changeBranch(event.target.value));
els.employeeBranch.addEventListener("change", (event) => changeBranch(event.target.value));
els.downloadMonthlyReport.addEventListener("click", downloadMonthlyReport);
els.employeeDownloadMonthlyReport.addEventListener("click", downloadMonthlyReport);
els.monthlyReportBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-delete-entry]");
  if (!button) return;

  deleteEntry(button.dataset.deleteEntry);
  renderManager();
});
els.employeeEntriesBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-delete-entry]");
  if (!button) return;

  const storageKey = button.dataset.deleteEntry;
  deleteEntry(storageKey);

  if (storageKey === entryKey()) {
    resetEmployeeForm();
  } else {
    renderEmployeeEntries();
  }

  els.saveStatus.textContent = "تم حذف الصف المحدد.";
});

document.querySelectorAll("[data-action='logout']").forEach((button) => {
  button.addEventListener("click", () => {
    state.currentRole = null;
    els.loginError.textContent = "";
    showView(els.loginView);
    els.userCode.focus();
  });
});

[els.cashAmount, els.networkAmount].forEach((input) => {
  input.addEventListener("input", () => {
    cleanMoneyInput(input);
    updateTotal();
  });

  input.addEventListener("blur", () => {
    cleanMoneyInput(input, true);
    updateTotal();
  });
});

els.ticketCounters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-counter]");
  if (!button) return;

  const key = button.dataset.counter;
  const step = Number(button.dataset.step || 1);
  state.counters[key] = Math.max(0, Number(state.counters[key] || 0) + step);
  renderCounters();
});

els.entryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const entry = {
    storageKey: entryKey(),
    branchKey: state.selectedBranch,
    branch: branchLabel(),
    dateKey: todayKey(),
    dateDisplay: displayDate(),
    savedAt: new Date().toISOString(),
    savedAtDisplay: displayTime(),
    employeeName: els.employeeName.value.trim(),
    cash: wholeNumber(els.cashAmount.value),
    network: wholeNumber(els.networkAmount.value),
    tickets: { ...state.counters },
    purchases: els.purchases.value.trim(),
  };

  saveEntry(entry);
  if (state.currentRole === "manager") renderManager();
  renderEmployeeEntries();
  els.saveStatus.textContent = `تم حفظ بيانات فرع ${entry.branch} بتاريخ ${entry.dateDisplay} في ${entry.savedAtDisplay}.`;
});

fillBranchSelects();
showView(els.loginView);
els.userCode.focus();
