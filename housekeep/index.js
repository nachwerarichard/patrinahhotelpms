/* ==========================================================
   Authenticated Core Fetch Utility Function
   ========================================================== */


/* ==========================================================
   Hotel App Front-End Logic (Unrestricted)
   ========================================================== */

const backendURL = 'https://patrinahhotelpms.onrender.com/api';

// --- App State ---
let allChecklists = [];
let currentPage = 1;
const rowsPerPage = 5;
let allStatusReports = [];
let filteredStatusReports = [];
let allInventory = [];

// --- Tab Elements ---
const tabChecklistBtn = document.getElementById('tabChecklist');
const tabHousekeepingBtn = document.getElementById('tabHousekeeping');
const tabInventoryBtn = document.getElementById('tabInventory');

const roomChecklistSection = document.getElementById('roomChecklistSection');
const housekeepingReportSection = document.getElementById('housekeepingReportSection');
const inventorySection = document.getElementById('inventorySection');

/* ---------- Helpers ---------- */
const humanize = (str) =>
  String(str)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

function showMessage(elementId, msg, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('text-green-600', 'text-red-600');
  el.classList.add(isError ? 'text-red-600' : 'text-green-600');
  setTimeout(() => {
    el.textContent = '';
  }, 5000);
}

/* ---------- Tab Logic ---------- */
function resetTabButtons() {
  [tabChecklistBtn, tabHousekeepingBtn, tabInventoryBtn].forEach((btn) => {
    if (!btn) return;
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('bg-gray-200', 'text-gray-700');
  });
}

function hideAllSections() {
  roomChecklistSection?.classList.add('hidden');
  housekeepingReportSection?.classList.add('hidden');
  inventorySection?.classList.add('hidden');
}

async function showTab(tabName) {
  hideAllSections();
  resetTabButtons();

  if (tabName === 'checklist') {
    roomChecklistSection?.classList.remove('hidden');
    tabChecklistBtn?.classList.remove('bg-gray-200', 'text-gray-700');
    tabChecklistBtn?.classList.add('bg-blue-600', 'text-white');
    await loadChecklists();
  } else if (tabName === 'housekeeping') {
    housekeepingReportSection?.classList.remove('hidden');
    tabHousekeepingBtn?.classList.remove('bg-gray-200', 'text-gray-700');
    tabHousekeepingBtn?.classList.add('bg-blue-600', 'text-white');
    await loadStatusReports();
  } else if (tabName === 'inventory') {
    inventorySection?.classList.remove('hidden');
    tabInventoryBtn?.classList.remove('bg-gray-200', 'text-gray-700');
    tabInventoryBtn?.classList.add('bg-blue-600', 'text-white');
    await loadInventory();
  }
}

// Tab button handlers
tabChecklistBtn?.addEventListener('click', () => showTab('checklist'));
tabHousekeepingBtn?.addEventListener('click', () => showTab('housekeeping'));
tabInventoryBtn?.addEventListener('click', () => showTab('inventory'));

/* ---------- Startup ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Directly show the main app since there's no login
  showTab('checklist');

  const missingItemsDateFilter = document.getElementById('missingItemsDateFilter');
  if (missingItemsDateFilter) {
    missingItemsDateFilter.addEventListener('change', renderMissingItemsSummary);
  }
});

/* ---------- Room Checklist ---------- */
function exportToExcel() {
  const dataToExport = allChecklists.map((entry) => ({
    Room: entry.room,
    Date: entry.date,
    Items: Object.entries(entry.items)
      .map(([k, v]) => `${humanize(k)}: ${humanize(v)}`)
      .join(', '),
  }));
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Checklist Data');
  XLSX.writeFile(wb, 'Hotel_Room_Checklist.xlsx');
}

function printChecklists() {
  const win = window.open('', '_blank');
  win.document.write('<html><head><title>Room Checklist</title>');
  win.document.write('<style>body{font-family:sans-serif;margin:20px;}h1{text-align:center;margin-bottom:20px;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}th{background:#f2f2f2;}</style>');
  win.document.write('</head><body>');
  win.document.write('<h1>Hotel Room Checklist</h1>');
  win.document.write('<table><thead><tr><th>Room</th><th>Date</th><th>Items</th></tr></thead><tbody>');
  allChecklists.forEach((entry) => {
    win.document.write('<tr>');
    win.document.write(`<td>${entry.room}</td>`);
    win.document.write(`<td>${entry.date}</td>`);
    win.document.write(
      `<td>${Object.entries(entry.items)
        .map(([k, v]) => `${humanize(k)}: ${humanize(v)}`)
        .join(', ')}</td>`
    );
    win.document.write('</tr>');
  });
  win.document.write('</tbody></table></body></html>');
  win.document.close();
  win.print();
}

document.getElementById('checklistForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const room = document.getElementById('room').value;
  const date = document.getElementById('date').value;
  if (!room || !date) {
    showMessage('message', 'Please select a room and date.', true);
    return;
  }
  const formData = new FormData(e.target);
  const items = Object.fromEntries(formData.entries());
  delete items.room;
  delete items.date;

  try {
    // Replaced native fetch with authenticatedFetch
    const res = await authenticatedFetch(`${backendURL}/submit-checklist`, {
      method: 'POST',
      body: JSON.stringify({ room, date, items }),
    });
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res ? res.status : 'No Response'}`);

    const result = await res.json();
    let msg = result.message || 'Checklist submitted.';
    if (result.emailSent) msg += ' Email sent for missing items.';
    showMessage('message', msg);
    e.target.reset();
    await loadChecklists();
  } catch (err) {
    console.error('Error submitting checklist:', err);
    showMessage('message', 'An error occurred while submitting the checklist.', true);
  }
});

async function loadChecklists() {
  try {
    // Replaced native fetch with authenticatedFetch
    const res = await authenticatedFetch(`${backendURL}/checklists`, {
      method: 'GET'
    });
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res ? res.status : 'No Response'}`);
    allChecklists = await res.json();
    renderChecklistTable();
    renderMissingItemsSummary();
  } catch (err) {
    console.error('Error loading checklists:', err);
    showMessage('message', 'Failed to load checklists.', true);
  }
}

function getFilteredChecklists() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  return allChecklists.filter((entry) => {
    const haystack =
      `${entry.room} ${entry.date} ${JSON.stringify(entry.items)}`.toLowerCase();
    return haystack.includes(search);
  });
}

function renderChecklistTable() {
  const tbody = document.getElementById('checklistBody');
  if (!tbody) return;
  const actionsHeader = document.getElementById('checklistActionsHeader');
  if (actionsHeader) actionsHeader.classList.remove('hidden');

  const filtered = getFilteredChecklists();
  const start = (currentPage - 1) * rowsPerPage;
  const pageSlice = filtered.slice(start, start + rowsPerPage);

  tbody.innerHTML = '';

  if (pageSlice.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center py-4 text-gray-500">No checklists found.</td></tr>';
  } else {
    pageSlice.forEach((entry) => {
      const tr = document.createElement('tr');
      tr.dataset.id = entry._id;
      const actionsHtml = `
        <td class="border px-4 py-2">
          <button class="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 mr-2"
            onclick='editChecklist("${entry._id}")'>Edit</button>
          <button class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
            onclick='deleteChecklist("${entry._id}")'>Delete</button>
        </td>`;

      tr.innerHTML = `
        <td class="border px-4 py-2">${entry.room}</td>
        <td class="border px-4 py-2">${entry.date}</td>
        <td class="border px-4 py-2">
          ${Object.entries(entry.items).map(([k, v]) => `${humanize(k)}: ${humanize(v)}`).join(', ')}
        </td>
        ${actionsHtml}
      `;
      tbody.appendChild(tr);
    });
  }

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prevBtn').disabled = currentPage === 1;
  document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

function editChecklist(id) {
  const entry = allChecklists.find((c) => c._id === id);
  if (!entry) return;

  const tbody = document.getElementById('checklistBody');
  const row = tbody.querySelector(`tr[data-id="${id}"]`);
  const itemsHtml = Object.keys(entry.items)
    .map(
      (key) => `
      <div class="flex items-center justify-between py-1">
        <span class="font-medium">${humanize(key)}:</span>
        <select id="item-${key}-${id}" class="px-2 py-1 border rounded-md text-sm">
          <option value="yes" ${entry.items[key] === 'yes' ? 'selected' : ''}>Yes</option>
          <option value="no" ${entry.items[key] === 'no' ? 'selected' : ''}>No</option>
        </select>
      </div>`
    )
    .join('');

  const editRowHtml = `
    <tr class="bg-blue-50" data-id="${id}">
      <td class="border px-4 py-2">
        <input type="text" id="editRoom-${id}" value="${entry.room}" class="w-full px-2 py-1 border rounded-md"/>
      </td>
      <td class="border px-4 py-2">
        <input type="date" id="editDate-${id}" value="${entry.date}" class="w-full px-2 py-1 border rounded-md"/>
      </td>
      <td class="border px-4 py-2">
        <div class="space-y-1">${itemsHtml}</div>
      </td>
      <td class="border px-4 py-2">
        <button class="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 mr-2" onclick='saveChecklist("${id}")'>Save</button>
        <button class="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600" onclick='loadChecklists()'>Cancel</button>
      </td>
    </tr>
  `;
  if (row) row.outerHTML = editRowHtml;
}

async function saveChecklist(id) {
  const room = document.getElementById(`editRoom-${id}`).value;
  const date = document.getElementById(`editDate-${id}`).value;
  const itemElements = document.querySelectorAll(`[id^="item-"][id$="-${id}"]`);
  const items = {};
  itemElements.forEach((el) => {
    const key = el.id.replace(`item-`, '').replace(`-${id}`, '');
    items[key] = el.value;
  });

  try {
    // Replaced native fetch with authenticatedFetch
    const res = await authenticatedFetch(`${backendURL}/checklists/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ room, date, items }),
    });
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res ? res.status : 'No Response'}`);
    const result = await res.json();
    showMessage('message', result.message || 'Checklist updated successfully!');
    await loadChecklists();
  } catch (err) {
    console.error('Error saving checklist:', err);
    showMessage('message', 'An error occurred while saving the checklist.', true);
  }
}

async function deleteChecklist(id) {
  if (!window.confirm('Are you sure you want to delete this checklist?')) return;

  try {
    // Replaced native fetch with authenticatedFetch
    const res = await authenticatedFetch(`${backendURL}/checklists/${id}`, {
      method: 'DELETE',
    });
    if (!res || !res.ok) throw new Error(`HTTP error! status: ${res ? res.status : 'No Response'}`);
    const result = await res.json();
    showMessage('message', result.message || 'Checklist deleted successfully!');
    await loadChecklists();
  } catch (err) {
    console.error('Error deleting checklist:', err);
    showMessage('message', 'An error occurred while deleting the checklist.', true);
  }
}

// Checklist search & pagination
document.getElementById('searchInput')?.addEventListener('input', () => {
  currentPage = 1;
  renderChecklistTable();
});

document.getElementById('prevBtn')?.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderChecklistTable();
  }
});

document.getElementById('nextBtn')?.addEventListener('click', () => {
  const totalPages = Math.ceil(getFilteredChecklists().length / rowsPerPage) || 1;
  if (currentPage < totalPages) {
    currentPage++;
    renderChecklistTable();
  }
});

/* ---------- Missing Items Summary ---------- */
function renderMissingItemsSummary() {
  const summaryContainer = document.getElementById('missingItemsSummary');
  if (!summaryContainer) return;

  const filterDateInput = document.getElementById('missingItemsDateFilter')?.value;
  let data = allChecklists;

  if (filterDateInput) {
    const selectedDate = new Date(filterDateInput);
    selectedDate.setHours(0, 0, 0, 0);

    data = allChecklists.filter((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === selectedDate.getTime();
    });
  }

  const missingItemsCount = {};
  const missingItemsRooms = {};

  data.forEach((entry) => {
    for (const itemKey in entry.items) {
      if (String(entry.items[itemKey]).toLowerCase() === 'no') {
        const label = humanize(itemKey);
        missingItemsCount[label] = (missingItemsCount[label] || 0) + 1;
        if (!missingItemsRooms[label]) missingItemsRooms[label] = [];
        missingItemsRooms[label].push(entry.room);
      }
    }
  });

  let html = '<h3 class="text-xl font-semibold mb-3 text-gray-800">Missing Items Summary</h3>';
  if (Object.keys(missingItemsCount).length === 0) {
    html += '<p class="text-gray-600">No missing items found for the selected date.</p>';
  } else {
    html += '<ul class="list-disc pl-5 space-y-2">';
    for (const item in missingItemsCount) {
      html += `<li><span class="font-semibold">${item}</span>: ${missingItemsCount[item]} missing. (Rooms: ${missingItemsRooms[item].join(', ')})</li>`;
    }
    html += '</ul>';
  }
  summaryContainer.innerHTML = html;
}

// Side-menu and section visibility toggles
function toggleMenu(id, element) {
    const submenu = document.getElementById(id);
    const icon = element.querySelector("i");
    const isSubmenuOpen = submenu.style.display === "flex";

    // Close all submenus and reset icons
    document.querySelectorAll('.submenu').forEach(menu => menu.style.display = 'none');
    document.querySelectorAll('.nav-item i').forEach(ic => {
        ic.classList.remove("fa-chevron-up");
        ic.classList.add("fa-chevron-down");
    });

    // Open clicked submenu only if it wasn't already open
    if (!isSubmenuOpen) {
        submenu.style.display = "flex";
        icon.classList.remove("fa-chevron-down");
        icon.classList.add("fa-chevron-up");
    }
}

function showSection(id) {
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    // Close all submenus when a section is targeted for a cleaner interface
    document.querySelectorAll('.submenu').forEach(menu => menu.style.display = 'none');
    document.querySelectorAll('.nav-item i').forEach(ic => {
        ic.classList.remove("fa-chevron-up");
        ic.classList.add("fa-chevron-down");
    });

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
}

// Stub implementations to handle downstream window exposures cleanly
async function loadStatusReports() { console.log("Loading Housekeeping Status Reports..."); }
async function loadInventory() { console.log("Loading Inventory Data..."); }
function filterStatusReportsByDate() {}
function clearStatusDateFilter() {}
function exportStatusReportsToExcel() {}
function printStatusReports() {}
function editStatusReport() {}
function saveStatusReport() {}
function deleteStatusReport() {}
function exportInventoryToExcel() {}
function editInventoryItem() {}
function saveInventoryItem() {}
function deleteInventoryItem() {}

// Initial load configuration routing
document.addEventListener('DOMContentLoaded', () => {
    showSection('checklistForm');
    const standardNavItem = document.querySelector('.nav-item');
    if (standardNavItem) standardNavItem.classList.add('active');
});

// Expose functions globally for dynamic DOM elements and inline HTML onclick callbacks
window.showTab = showTab;
window.exportToExcel = exportToExcel;
window.printChecklists = printChecklists;
window.editChecklist = editChecklist;
window.saveChecklist = saveChecklist;
window.deleteChecklist = deleteChecklist;
window.filterStatusReportsByDate = filterStatusReportsByDate;
window.clearStatusDateFilter = clearStatusDateFilter;
window.exportStatusReportsToExcel = exportStatusReportsToExcel;
window.printStatusReports = printStatusReports;
window.editStatusReport = editStatusReport;
window.saveStatusReport = saveStatusReport;
window.deleteStatusReport = deleteStatusReport;
window.exportInventoryToExcel = exportInventoryToExcel;
window.editInventoryItem = editInventoryItem;
window.saveInventoryItem = saveInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;