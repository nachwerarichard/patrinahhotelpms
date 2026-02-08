
    // Mobile menu toggle


    // Toggle submenu accordion style
    function toggleSubmenu(submenuId, navButtonId) {
    // 1. Get the target submenu and button
    const submenu = document.getElementById(submenuId);
    const navButton = document.querySelector(`[data-target="${submenuId}"]`);

    // 2. Find all main nav buttons and submenus
    const allSubmenus = document.querySelectorAll('.submenu');
    const allNavButtons = document.querySelectorAll('.nav-main');

    // 3. Close other submenus and reset their arrows
    allSubmenus.forEach(s => {
        if (s.id !== submenuId) {
            s.classList.remove('open');
            // Find and reset the arrow for the closed submenu's button
            const relatedBtn = document.querySelector(`[data-target="${s.id}"]`);
            const relatedArrow = relatedBtn?.querySelector('.arrow-icon');
            if (relatedArrow) {
                relatedArrow.classList.remove('fa-chevron-up');
                relatedArrow.classList.add('fa-chevron-down');
            }
        }
    });
    
    // 4. Reset highlight for all main nav buttons
    allNavButtons.forEach(btn => btn.classList.remove('active'));

    // 5. Open/close target submenu
    submenu.classList.toggle('open');
    
    // 6. Toggle the target nav button's highlight and arrow icon
    if (navButton) {
        const arrow = navButton.querySelector('.arrow-icon');
        
        if (submenu.classList.contains('open')) {
            navButton.classList.add('active');
            // Change arrow to UP 👆
            if (arrow) {
                arrow.classList.remove('fa-chevron-down');
                arrow.classList.add('fa-chevron-up');
            }
        } else {
            navButton.classList.remove('active');
            // Change arrow back to DOWN 👇
            if (arrow) {
                arrow.classList.remove('fa-chevron-up');
                arrow.classList.add('fa-chevron-down');
            }
        }
    }
}

    // Show a specific sub-section in the main area
    // parentNavId is optional; if provided, it will highlight the parent main button
    function showSubSection(sectionId, parentNavId = null, isSingle = false) {
      // hide all sub sections
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

      // show the requested section
      const target = document.getElementById(sectionId);
      if (target) target.classList.add('active');

      // clear active on all sub-items
      document.querySelectorAll('.sub-item').forEach(si => si.classList.remove('active'));

      // set active for the clicked sub-item (find by data-show)
      const clicked = Array.from(document.querySelectorAll('.sub-item')).find(el => el.getAttribute('data-show') === sectionId);
      if (clicked) clicked.classList.add('active');

      // highlight parent main nav button (if parentNavId provided)
      document.querySelectorAll('.nav-main').forEach(btn => btn.classList.remove('active'));
      if (parentNavId) {
        // highlight the main button that corresponds to the parent nav id
        const mainBtn = document.querySelector(`[data-target="${parentNavId.replace('nav-','')+'-submenu'}"], #${parentNavId}`);
        // fallback: find by nav id as provided
        const fallback = document.getElementById(parentNavId);
        if (mainBtn) mainBtn.classList.add('active');
        else if (fallback) fallback.classList.add('active');
      } else {
        // remove highlight from main buttons if no parent provided (e.g., audit logs)
        document.querySelectorAll('.nav-main').forEach(btn => btn.classList.remove('active'));
      }

      // If the clicked was inside a submenu, ensure that submenu is open
      const submenuForSection = Array.from(document.querySelectorAll('.submenu')).find(s => s.querySelector(`[data-show="${sectionId}"]`));
      if (submenuForSection) {
        // open it and close others
        document.querySelectorAll('.submenu').forEach(s => {
          if (s === submenuForSection) s.classList.add('open'); else s.classList.remove('open');
        });
      } else {
        // if section doesn't belong to a submenu (audit logs), close all submenus
        document.querySelectorAll('.submenu').forEach(s => s.classList.remove('open'));
      }

      // mobile: close sidebar after selection
      if (window.innerWidth < 1024) document.getElementById('sidebar').classList.add('-translate-x-full');
    }

    // Initialize default open section & styles
    function initSidebarState() {
      // show inventory-add by default
      showSubSection('inventory-add', 'nav-inventory');

      // pre-open inventory submenu
      document.getElementById('inventory-submenu').classList.add('open');
      // mark main button active
      document.querySelector(`[data-target="inventory-submenu"]`)?.classList.add('active');
      // mark sub-item active
      document.querySelector(`[data-show="inventory-add"]`)?.classList.add('active');
    }

    // Ensure close button of modal works
    document.addEventListener('DOMContentLoaded', () => {
      // If already logged-in state desired in dev, call initSidebarState() here.
      // but we keep default login screen until login() called.
      const closeBtn = document.querySelector('#edit-inventory-modal .close-button');
      if (closeBtn) closeBtn.addEventListener('click', () => document.getElementById('edit-inventory-modal').classList.add('hidden'));
    });

    // --- Placeholder functions (you already had these) ---
    function fetchInventory() { console.log('Fetching inventory...'); }
    function fetchSales() { console.log('Fetching sales...'); }
    function fetchExpenses() { console.log('Fetching expenses...'); }
    function fetchCashJournal() { console.log('Fetching cash journal...'); }
    function generateReports() { console.log('Generating reports...'); }
    function exportTableToExcel(tableId, filename) {
      console.log(`Exporting table ${tableId} to ${filename}.xlsx`);
      // Keep your SheetJS integration or implementation here.
    }





 // UX: Simplified functions for opening/closing modals 
        function openModal(id) {
            document.getElementById(id).classList.remove('hidden');
        }
        function closeModal(id) {
            document.getElementById(id).classList.add('hidden');
        }

        // UX: Sidebar Toggle for Mobile/Small Screens
        const sidebar = document.getElementById('sidebar');
        const menuToggleOpen = document.getElementById('menu-toggle-open');

        menuToggleOpen.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
        });

        // Add a click listener to the main content area to close the sidebar when open on small screens
        const mainContent = document.getElementById('main-content');
        mainContent.addEventListener('click', () => {
            if (!sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
            }
        });


        // UX: Function to handle sidebar navigation and section display
        function showSubSection(sectionId, navId) {
            // 1. Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            // 2. Show the target section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // 3. Update main navigation active state (removes old 'active', sets new 'active')
            document.querySelectorAll('.nav-main').forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('text-white'); // ensure text color resets
            });
            const mainNav = document.getElementById(navId);
            if (mainNav) {
                 mainNav.classList.add('active');
                 mainNav.classList.add('text-white'); // Apply white text color to active main nav
            }

            // 4. Update sub-item active state
            document.querySelectorAll('.sub-item').forEach(btn => {
                btn.classList.remove('active');
            });
            // Find the specific button that was clicked using the sectionId to apply 'sub-item active'
            const clickedSubItem = document.querySelector(`.sub-item[data-show="${sectionId}"]`);
            if (clickedSubItem) {
                clickedSubItem.classList.add('active');
            }
            
            // 5. UX: Hide sidebar on small screens after clicking a link
            if (window.innerWidth < 1024) {
                 sidebar.classList.add('-translate-x-full');
            }
        }

        // UX: Function to handle submenu open/close and arrow rotation
        function toggleSubmenu(submenuId, navId) {
            const submenu = document.getElementById(submenuId);
            const navButton = document.getElementById(navId);
            const arrowIcon = navButton ? navButton.querySelector('.arrow-icon') : null;

            if (submenu.classList.contains('open')) {
                submenu.classList.remove('open');
                if (arrowIcon) {
                    arrowIcon.style.transform = 'rotate(0deg)';
                }
            } else {
                // Close all other submenus first (improved UX)
                document.querySelectorAll('.submenu').forEach(sub => {
                    sub.classList.remove('open');
                    const parentButton = document.getElementById(sub.id.replace('-submenu', ''));
                    if (parentButton) {
                        const parentArrow = parentButton.querySelector('.arrow-icon');
                        if (parentArrow) parentArrow.style.transform = 'rotate(0deg)';
                    }
                });

                // Open the target submenu
                submenu.classList.add('open');
                if (arrowIcon) {
                    arrowIcon.style.transform = 'rotate(180deg)';
                }
            }
        }
        
        // UX: Set initial state on load
        document.addEventListener('DOMContentLoaded', () => {
             // 1. Show the Dashboard by default
            showSubSection('dashboard', 'nav-dashboard');

             
        });


// Sidebar close button (mobile only)
document.getElementById('close-sidebar').addEventListener('click', function () {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('-translate-x-full'); // Hide sidebar by sliding it left
});
