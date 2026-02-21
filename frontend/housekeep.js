/* ===============================
  Hotel App Front-End Logic (Unrestricted)
  =============================== */

const backendURL = 'https://novouscloudpms-tz4s.onrender.com/api';
let allStatusReports = [];
let filteredStatusReports = [];

// --- Tab Elements ---

const housekeepingReportSection = document.getElementById('housekeepingReportSection');
const inventorySection = document.getElementById('inventorySection');

/* ---------- Helpers ---------- */
const humanize = (str) =>
  String(str)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

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

// Tab button handlers
tabChecklistBtn?.addEventListener('click', () => showTab('checklist'));
tabHousekeepingBtn?.addEventListener('click', () => showTab('housekeeping'));
tabInventoryBtn?.addEventListener('click', () => showTab('inventory'));





/* ---------- Housekeeping Reports ---------- */
document.getElementById('statusReportForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
   const res = await authenticatedFetch(`${backendURL}/submit-status-report`, {
  method: 'POST',
  body: JSON.stringify(data),
});
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const result = await res.json();
    showMessage('statusMessage', result.message || 'Status report submitted.');
    e.target.reset();
    await loadStatusReports();
  } catch (err) {
    console.error('Error submitting status report:', err);
    showMessage('statusMessage', 'An error occurred while submitting the report.', true);
  }
});

async function loadStatusReports() {
  try {
const res = await authenticatedFetch(`${backendURL}/status-reports`);    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    allStatusReports = await res.json();
    filteredStatusReports = [...allStatusReports];
    renderStatusReportTable();
  } catch (err) {
    console.error('Error loading status reports:', err);
    showMessage('statusMessage', 'Failed to load status reports.', true);
  }
}

function renderStatusReportTable() {
  const tbody = document.getElementById('statusReportBody');
  if (!tbody) return;
  const actionsHeader = document.getElementById('statusActionsHeader');
  if (actionsHeader) actionsHeader.classList.remove('hidden');

  tbody.innerHTML = '';
  if (filteredStatusReports.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center py-4 text-gray-500">No housekeeping reports found.</td></tr>';
    return;
  }

  filteredStatusReports.forEach((report) => {
    const tr = document.createElement('tr');
    tr.dataset.id = report._id;
    const actionsHtml = `
      <td class="border px-4 py-2">
        <button class="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 mr-2" onclick='editStatusReport("${report._id}")'>Edit</button>
        <button class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600" onclick='deleteStatusReport("${report._id}")'>Delete</button>
      </td>`;

    tr.innerHTML = `
      <td class="border px-4 py-2">${report.room}</td>
      <td class="border px-4 py-2">${report.category}</td>
      <td class="border px-4 py-2">${humanize(report.status)}</td>
      <td class="border px-4 py-2">${report.remarks}</td>
      <td class="border px-4 py-2">${new Date(report.dateTime).toLocaleString()}</td>
      ${actionsHtml}
    `;
    tbody.appendChild(tr);
  });
}

function filterStatusReportsByDate() {
  const filterDateInput = document.getElementById('filterDate')?.value;
  if (filterDateInput) {
    const selectedDate = new Date(filterDateInput);
    selectedDate.setHours(0, 0, 0, 0);
    filteredStatusReports = allStatusReports.filter((report) => {
      const reportDate = new Date(report.dateTime);
      reportDate.setHours(0, 0, 0, 0);
      return reportDate.getTime() === selectedDate.getTime();
    });
  } else {
    filteredStatusReports = [...allStatusReports];
  }
  renderStatusReportTable();
}

function clearStatusDateFilter() {
  const el = document.getElementById('filterDate');
  if (el) el.value = '';
  filteredStatusReports = [...allStatusReports];
  renderStatusReportTable();
}

function exportStatusReportsToExcel() {
  const dataToExport = filteredStatusReports.map((report) => ({
    Room: report.room,
    Category: report.category,
    Status: humanize(report.status),
    Remarks: report.remarks,
    'Date & Time': new Date(report.dateTime).toLocaleString(),
  }));
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Housekeeping Reports');
  XLSX.writeFile(wb, 'Hotel_Housekeeping_Reports.xlsx');
}

function printStatusReports() {
  const win = window.open('', '_blank');
  win.document.write('<html><head><title>Housekeeping Report</title>');
  win.document.write('<style>body{font-family:sans-serif;margin:20px;}h1{text-align:center;margin-bottom:20px;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}th{background:#f2f2f2;}</style>');
  win.document.write('</head><body>');
  win.document.write('<h1>Housekeeping Room Status Report</h1>');
  win.document.write('<table><thead><tr><th>Room</th><th>Category</th><th>Status</th><th>Remarks</th><th>Date & Time</th></tr></thead><tbody>');
  filteredStatusReports.forEach((report) => {
    win.document.write('<tr>');
    win.document.write(`<td>${report.room}</td>`);
    win.document.write(`<td>${report.category}</td>`);
    win.document.write(`<td>${humanize(report.status)}</td>`);
    win.document.write(`<td>${report.remarks}</td>`);
    win.document.write(`<td>${new Date(report.dateTime).toLocaleString()}</td>`);
    win.document.write('</tr>');
  });
  win.document.write('</tbody></table></body></html>');
  win.document.close();
  win.print();
}

function editStatusReport(id) {
  const report = allStatusReports.find((r) => r._id === id);
  if (!report) return;

  const tbody = document.getElementById('statusReportBody');
  const row = tbody.querySelector(`tr[data-id="${id}"]`);

  const editRowHtml = `
    <tr class="bg-blue-50" data-id="${id}">
      <td class="border px-4 py-2"><input type="text" id="editReportRoom-${id}" value="${report.room}" class="w-full px-2 py-1 border rounded-md"/></td>
      <td class="border px-4 py-2">
        <select id="editReportCategory-${id}" class="w-full px-2 py-1 border rounded-md">
          <option value="delux1" ${report.category === 'delux1' ? 'selected' : ''}>Delux 1</option>
          <option value="delux2" ${report.category === 'delux2' ? 'selected' : ''}>Delux 2</option>
          <option value="standard" ${report.category === 'standard' ? 'selected' : ''}>Standard</option>
        </select>
      </td>
      <td class="border px-4 py-2">
        <select id="editReportStatus-${id}" class="w-full px-2 py-1 border rounded-md">
          <option value="arrival" ${report.status === 'arrival' ? 'selected' : ''}>Arrival</option>
          <option value="occupied" ${report.status === 'occupied' ? 'selected' : ''}>Occupied</option>
          <option value="departure" ${report.status === 'departure' ? 'selected' : ''}>Departure</option>
          <option value="vacant_ready" ${report.status === 'vacant_ready' ? 'selected' : ''}>Vacant Ready</option>
          <option value="vacant_not_ready" ${report.status === 'vacant_not_ready' ? 'selected' : ''}>Vacant but not Ready</option>
          <option value="out_of_order" ${report.status === 'out_of_order' ? 'selected' : ''}>Out of Order</option>
          <option value="out_of_service" ${report.status === 'out_of_service' ? 'selected' : ''}>Out of Service</option>
        </select>
      </td>
      <td class="border px-4 py-2"><textarea id="editReportRemarks-${id}" class="w-full px-2 py-1 border rounded-md" rows="2">${report.remarks}</textarea></td>
      <td class="border px-4 py-2"><input type="datetime-local" id="editReportDateTime-${id}" value="${new Date(report.dateTime).toISOString().slice(0,16)}" class="w-full px-2 py-1 border rounded-md"/></td>
      <td class="border px-4 py-2">
        <button class="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 mr-2" onclick='saveStatusReport("${id}")'>Save</button>
        <button class="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600" onclick='loadStatusReports()'>Cancel</button>
      </td>
    </tr>
  `;
  if (row) row.outerHTML = editRowHtml;
}

async function saveStatusReport(id) {
  const updatedData = {
    room: document.getElementById(`editReportRoom-${id}`).value,
    category: document.getElementById(`editReportCategory-${id}`).value,
    status: document.getElementById(`editReportStatus-${id}`).value,
    remarks: document.getElementById(`editReportRemarks-${id}`).value,
    dateTime: document.getElementById(`editReportDateTime-${id}`).value,
  };

  try {
    const res = await authenticatedFetch(`${backendURL}/status-reports/${id}`, {
  method: 'PUT',
  body: JSON.stringify(updatedData),
});
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const result = await res.json();
    showMessage('statusMessage', result.message || 'Report updated successfully!');
    await loadStatusReports();
  } catch (err) {
    console.error('Error saving status report:', err);
    showMessage('statusMessage', 'An error occurred while saving the report.', true);
  }
}

async function deleteStatusReport(id) {
  if (!window.confirm('Are you sure you want to delete this status report?')) return;

  try {
    const res = await authenticatedFetch(`${backendURL}/status-reports/${id}`, {
  method: 'DELETE',
});
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const result = await res.json();
    showMessage('statusMessage', result.message || 'Report deleted successfully!');
    await loadStatusReports();
  } catch (err) {
    console.error('Error deleting status report:', err);
    showMessage('statusMessage', 'An error occurred while deleting the report.', true);
  }
}
// Expose functions used by inline onclick
window.exportToExcel = exportToExcel;
window.filterStatusReportsByDate = filterStatusReportsByDate;
window.clearStatusDateFilter = clearStatusDateFilter;
window.exportStatusReportsToExcel = exportStatusReportsToExcel;
window.printStatusReports = printStatusReports;
window.editStatusReport = editStatusReport;
window.saveStatusReport = saveStatusReport;
window.deleteStatusReport = deleteStatusReport;
