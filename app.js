const SUPABASE_URL = "https://tdhnzwlavuurhivvgicz.supabase.co";
const SUPABASE_KEY = "sb_publishable_K-GwDFmZtO2af1qu4w-Oeg_iqROGxBh";
const ATTACHMENTS_BUCKET = "income-attachments";

const supabase = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY) || null;

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

const state = {
  currentRole: null,
  selectedBranch: BRANCHES[0].key,
  entries: [],
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
  toggleUserCode: document.querySelector("#toggleUserCode"),
  entryForm: document.querySelector("#entryForm"),
  employeeBranch: document.querySelector("#employeeBranch"),
  employeeTitle: document.querySelector("#employeeTitle"),
  employeeName: document.querySelector("#employeeName"),
  cashAmount: document.querySelector("#cashAmount"),
  networkAmount: document.querySelector("#networkAmount"),
  totalAmount: document.querySelector("#totalAmount"),
  purchases: document.querySelector("#purchases"),
  attachments: document.querySelector("#attachments"),
  employeeCurrentAttachments: document.querySelector("#employeeCurrentAttachments"),
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
  managerAttachments: document.querySelector("#managerAttachments"),
  monthlyReportMeta: document.querySelector("#monthlyReportMeta"),
  monthlyReportTotals: document.querySelector("#monthlyReportTotals"),
  monthlyReportBody: document.querySelector("#monthlyReportBody"),
  downloadMonthlyReport: document.querySelector("#downloadMonthlyReport"),
};

function isSupabaseReady() {
  return Boolean(supabase && SUPABASE_KEY && !SUPABASE_KEY.includes("ضع هنا"));
}

function supabaseSetupMessage() {
  if (!window.supabase) {
    return "تعذر تحميل مكتبة Supabase. تأكد أن الجهاز متصل بالإنترنت وأن رابط CDN غير محجوب.";
  }

  if (!SUPABASE_KEY || SUPABASE_KEY.includes("ضع هنا")) {
    return "لم يتم إضافة publishable key الخاص بـ Supabase داخل app.js. استبدل عبارة: ضع هنا publishable key الحالي بالمفتاح الحقيقي.";
  }

  return "إعداد Supabase غير مكتمل.";
}

function setStatus(message, isError = false) {
  els.saveStatus.textContent = message;
  els.saveStatus.classList.toggle("error-text", isError);
}

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

function entryKey(branchKey = state.selectedBranch, dateKeyValue = todayKey()) {
  return `${branchKey}:${dateKeyValue}`;
}

function currentMonthKey() {
  return todayKey().slice(0, 7);
}

function normalizeEntry(row) {
  return {
    storageKey: row.storage_key,
    branchKey: row.branch_key,
    branch: row.branch,
    dateKey: row.date_key,
    dateDisplay: row.date_display,
    savedAt: row.saved_at,
    savedAtDisplay: row.saved_at_display,
    employeeName: row.employee_name,
    cash: Number(row.cash || 0),
    network: Number(row.network || 0),
    tickets: row.tickets || {},
    purchases: row.purchases || "",
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
  };
}

function toRow(entry) {
  return {
    storage_key: entry.storageKey,
    branch_key: entry.branchKey,
    branch: entry.branch,
    date_key: entry.dateKey,
    date_display: entry.dateDisplay,
    saved_at: entry.savedAt,
    saved_at_display: entry.savedAtDisplay,
    employee_name: entry.employeeName,
    cash: entry.cash,
    network: entry.network,
    tickets: entry.tickets,
    purchases: entry.purchases,
    attachments: entry.attachments || [],
  };
}

async function loadEntries() {
  if (!isSupabaseReady()) {
    throw new Error(supabaseSetupMessage());
  }

  const { data, error } = await supabase
    .from("income_entries")
    .select("*")
    .eq("branch_key", state.selectedBranch)
    .gte("date_key", `${currentMonthKey()}-01`)
    .lte("date_key", `${currentMonthKey()}-31`)
    .order("date_key", { ascending: true });

  if (error) throw new Error(`فشل قراءة البيانات: ${error.message}`);
  state.entries = (data || []).map(normalizeEntry);
  return state.entries;
}

async function saveEntry(entry) {
  if (!isSupabaseReady()) {
    throw new Error(supabaseSetupMessage());
  }

  const { error } = await supabase
    .from("income_entries")
    .upsert(toRow(entry), { onConflict: "storage_key" });

  if (error) throw new Error(`فشل حفظ البيانات: ${error.message}`);
  await loadEntries();
}

async function deleteEntry(storageKey) {
  if (!isSupabaseReady()) {
    throw new Error(supabaseSetupMessage());
  }

  const { error } = await supabase
    .from("income_entries")
    .delete()
    .eq("storage_key", storageKey);

  if (error) throw new Error(`فشل حذف السجل: ${error.message}`);
  await loadEntries();
}

function todayEntry(branchKey = state.selectedBranch) {
  return state.entries.find((entry) => entry.storageKey === entryKey(branchKey)) || null;
}

function monthlyEntries(branchKey = state.selectedBranch) {
  return state.entries
    .filter((entry) => entry.branchKey === branchKey && entry.dateKey?.startsWith(currentMonthKey()))
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

function fileLinksText(attachments = []) {
  return attachments.map((file) => file.url).filter(Boolean).join(" | ");
}

function renderAttachments(attachments = []) {
  if (!Array.isArray(attachments) || !attachments.length) {
    return '<p class="empty-attachments">لا توجد مرفقات</p>';
  }

  return attachments.map((file) => {
    const name = escapeHtml(file.name || "مرفق");
    const url = escapeHtml(file.url || "#");
    const type = String(file.type || "");

    if (type.startsWith("image/")) {
      return `
        <a class="attachment-card" href="${url}" target="_blank" rel="noopener">
          <img src="${url}" alt="${name}" loading="lazy" />
          <span>${name}</span>
        </a>
      `;
    }

    return `
      <a class="attachment-link" href="${url}" target="_blank" rel="noopener">
        ${name}
      </a>
    `;
  }).join("");
}

function renderAttachmentLinks(attachments = []) {
  if (!Array.isArray(attachments) || !attachments.length) return "لا توجد";
  return attachments.map((file) => {
    const name = escapeHtml(file.name || "مرفق");
    const url = escapeHtml(file.url || "#");
    return `<a href="${url}" target="_blank" rel="noopener">${name}</a>`;
  }).join("<br>");
}

async function uploadAttachments(files, existingAttachments = []) {
  const selectedFiles = Array.from(files || []);
  if (!selectedFiles.length) return existingAttachments;

  if (!isSupabaseReady()) {
    throw new Error(`لا يمكن رفع المرفقات: ${supabaseSetupMessage()}`);
  }

  const uploaded = [];

  for (const file of selectedFiles) {
    const safeName = file.name.replace(/[^\w.\-ء-ي]+/g, "-");
    const path = `${state.selectedBranch}/${todayKey()}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) throw new Error(`فشل رفع الملف ${file.name}: ${error.message}`);

    const { data } = supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .getPublicUrl(path);

    uploaded.push({
      name: file.name,
      url: data.publicUrl,
      type: file.type || "application/octet-stream",
    });
  }

  return [...existingAttachments, ...uploaded];
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

async function refreshCurrentView() {
  await loadEntries();

  if (state.currentRole === "manager") {
    renderManager();
  }

  if (state.currentRole === "employee") {
    renderEmployeeForm();
  }
}

function renderEmployeeForm() {
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
  els.attachments.value = "";
  els.employeeCurrentAttachments.innerHTML = renderAttachments(entry?.attachments || []);
  renderCounters();
  updateTotal();
  renderEmployeeEntries();
  setStatus(entry ? "تم تحميل بيانات اليوم المحفوظة لهذا الفرع." : "");
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
    els.managerAttachments.innerHTML = renderAttachments([]);
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
  els.managerAttachments.innerHTML = renderAttachments(entry.attachments || []);
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
    els.monthlyReportBody.innerHTML = '<tr><td class="empty-report" colspan="13">لا توجد إدخالات محفوظة لهذا الشهر.</td></tr>';
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
      <td>${renderAttachmentLinks(entry.attachments)}</td>
      <td><button class="danger-button" type="button" data-delete-entry="${escapeHtml(entry.storageKey)}">حذف</button></td>
    </tr>
  `).join("");
}

function renderEmployeeEntries() {
  const entries = monthlyEntries();

  if (!entries.length) {
    els.employeeEntriesBody.innerHTML = '<tr><td class="empty-report" colspan="9">لا توجد إدخالات محفوظة لهذا الشهر.</td></tr>';
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
      <td>${renderAttachmentLinks(entry.attachments)}</td>
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
      <td>${escapeHtml(fileLinksText(entry.attachments))}</td>
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
            <th>المرفقات</th>
          </tr>
          ${detailRows || '<tr><td colspan="13">لا توجد بيانات لهذا الشهر</td></tr>'}
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

async function changeBranch(branchKey) {
  state.selectedBranch = branchKey;
  syncBranchSelects();

  if (!state.currentRole) return;

  try {
    await refreshCurrentView();
  } catch (error) {
    setStatus(error.message, true);
  }
}

els.loginForm.addEventListener("submit", async (event) => {
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

  try {
    els.loginError.textContent = "جاري التحقق من الاتصال بقاعدة البيانات...";
    await loadEntries();

    if (role === "manager") {
      renderManager();
      showView(els.managerView);
    } else {
      renderEmployeeForm();
      showView(els.employeeView);
    }

    els.loginError.textContent = "";
  } catch (error) {
    els.loginError.textContent = error.message;
  }
});

els.toggleUserCode.addEventListener("click", () => {
  const isHidden = els.userCode.type === "password";
  els.userCode.type = isHidden ? "text" : "password";
  els.toggleUserCode.textContent = isHidden ? "إخفاء" : "إظهار";
  els.userCode.focus();
});

els.loginBranch.addEventListener("change", (event) => changeBranch(event.target.value));
els.managerBranch.addEventListener("change", (event) => changeBranch(event.target.value));
els.employeeBranch.addEventListener("change", (event) => changeBranch(event.target.value));
els.downloadMonthlyReport.addEventListener("click", downloadMonthlyReport);
els.employeeDownloadMonthlyReport.addEventListener("click", downloadMonthlyReport);

els.monthlyReportBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-delete-entry]");
  if (!button) return;

  try {
    await deleteEntry(button.dataset.deleteEntry);
    renderManager();
  } catch (error) {
    els.monthlyReportMeta.textContent = error.message;
  }
});

els.employeeEntriesBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-delete-entry]");
  if (!button) return;

  const storageKey = button.dataset.deleteEntry;

  try {
    await deleteEntry(storageKey);

    if (storageKey === entryKey()) {
      renderEmployeeForm();
    } else {
      renderEmployeeEntries();
    }

    setStatus("تم حذف الصف المحدد.");
  } catch (error) {
    setStatus(error.message, true);
  }
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

els.entryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("جاري الحفظ...");

  try {
    const existingEntry = todayEntry();
    const attachments = await uploadAttachments(els.attachments.files, existingEntry?.attachments || []);
    const now = new Date();
    const entry = {
      storageKey: entryKey(),
      branchKey: state.selectedBranch,
      branch: branchLabel(),
      dateKey: todayKey(),
      dateDisplay: displayDate(now),
      savedAt: now.toISOString(),
      savedAtDisplay: displayTime(now),
      employeeName: els.employeeName.value.trim(),
      cash: wholeNumber(els.cashAmount.value),
      network: wholeNumber(els.networkAmount.value),
      tickets: { ...state.counters },
      purchases: els.purchases.value.trim(),
      attachments,
    };

    await saveEntry(entry);
    renderEmployeeForm();
    setStatus(`تم حفظ بيانات فرع ${entry.branch} بتاريخ ${entry.dateDisplay} في ${entry.savedAtDisplay}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

fillBranchSelects();
const params = new URLSearchParams(window.location.search);
const codeFromUrl = params.get("userCode");
if (codeFromUrl && USERS[codeFromUrl]) {
  els.userCode.value = codeFromUrl;
}
showView(els.loginView);
els.userCode.focus();
