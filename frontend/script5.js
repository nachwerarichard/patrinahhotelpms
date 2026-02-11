   (function autoLoginHook() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('autoLogin') === 'true') {
        // 1. Inject CSS for the multi-tenant preloader
        const style = document.createElement('style');
        style.id = 'auto-login-styles';
        style.innerHTML = `
            #auto-login-overlay {
                position: fixed; 
                top: 0; left: 0; 
                width: 100%; height: 100%;
                background: white;
                display: flex; 
                flex-direction: column;
                justify-content: center; 
                align-items: center;
                z-index: 999999; 
                transition: opacity 0.4s ease;
            }
            .loader {
                --d: 22px;
                width: 4px; height: 4px;
                border-radius: 50%;
                color: #4f46e5; /* Indigo-600 to match your luxury theme */
                box-shadow: 
                    calc(1 * var(--d))      calc(0 * var(--d))      0 0,
                    calc(0.707 * var(--d)) calc(0.707 * var(--d)) 0 1px,
                    calc(0 * var(--d))      calc(1 * var(--d))      0 2px,
                    calc(-0.707 * var(--d)) calc(0.707 * var(--d)) 0 3px,
                    calc(-1 * var(--d))    calc(0 * var(--d))      0 4px,
                    calc(-0.707 * var(--d)) calc(-0.707 * var(--d)) 0 5px,
                    calc(0 * var(--d))      calc(-1 * var(--d))     0 6px;
                animation: l27 1s infinite steps(8);
            }
            @keyframes l27 { 100% { transform: rotate(1turn); } }
            .sync-text { margin-top: 2rem; font-family: sans-serif; font-size: 12px; color: #64748b; letter-spacing: 0.1em; font-weight: bold; }
        `;
        document.head.appendChild(style);

        // 2. Create Overlay with status text
        const overlay = document.createElement('div');
        overlay.id = 'auto-login-overlay';
        overlay.innerHTML = `
            <div class="loader"></div>
            <div class="sync-text">ESTABLISHING SECURE SESSION...</div>
        `;
        document.body.appendChild(overlay);

        const removeOverlay = () => {
            const el = document.getElementById('auto-login-overlay');
            if (el) {
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 400); 
            }
        };

        // 3. Auto-Login Logic
        const user = urlParams.get('u');
        const pass = urlParams.get('p');
        
        const userField = document.querySelector('input[type="text"]') || document.getElementById('username');
        const passField = document.querySelector('input[type="password"]') || document.getElementById('password');
        const loginBtn = document.querySelector('button[type="submit"]') || document.getElementById('login-button');

        if (userField && passField && loginBtn) {
            userField.value = user;
            passField.value = pass;

            // Strip credentials from URL immediately
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);

            setTimeout(() => {
                loginBtn.click();
                
                // Watchdog: Remove overlay once the main app container appears
                const checkFinished = setInterval(() => {
                    const mainContentVisible = document.getElementById('main-content')?.style.display === 'flex';
                    if (mainContentVisible) {
                        removeOverlay();
                        clearInterval(checkFinished);
                    }
                }, 50);

                // Safety timeout
                setTimeout(() => {
                    removeOverlay();
                    clearInterval(checkFinished);
                }, 3000); 
            }, 300);
        } else {
            removeOverlay();
        }
    }
})();
document.addEventListener('DOMContentLoaded', () => {
    // 1. Retrieve the full user object (contains username and hotelName)
    const savedUserData = localStorage.getItem('loggedInUser');

    if (savedUserData) {
        const user = JSON.parse(savedUserData);
        
        // Update global variables
        currentUsername = user.username;
        const hotelName = user.hotelName || "Hotel Management System";

        // 2. Update Username Display
        const userDisplay = document.getElementById('display-user-name');
        if (userDisplay) {
            userDisplay.textContent = user.username;
        }

        // 3. Update Hotel Name Display (The Branding)
        const hotelDisplay = document.getElementById('hotel-name-display');
        if (hotelDisplay) {
            hotelDisplay.textContent = hotelName;
            // Also update the document title so the browser tab shows the hotel name
            document.title = `${hotelName} | PMS`;
        }
    }
});
function closeSection(sectionId) {
  const element = document.getElementById(sectionId);
  
  if (element) {
    element.classList.add('hidden');
  } else {
    console.warn(`Element with ID "${sectionId}" not found.`);
  }
}
        // A function to show a specific section and hide all others
function showSection(sectionId) {
    // Hide all sections first
    const sections = document.querySelectorAll('main > section');
    sections.forEach(section => {
        section.classList.add('hidden');
        closeSection(dashbaord);
    });

    // Then show the target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // You can also manage the active state of your navigation links here
    const navItems = document.querySelectorAll('aside nav li a');
    navItems.forEach(item => {
        item.classList.remove('bg-gray-700', 'text-white');
    });

    // Add active class to the clicked link's parent <li>
    const clickedNavItem = document.getElementById(`nav-${sectionId}`);
    if (clickedNavItem) {
        clickedNavItem.querySelector('a').classList.add('bg-gray-700', 'text-white');
    }
}

// Add event listeners to the navigation links
document.addEventListener('DOMContentLoaded', () => {
    const navBooking = document.getElementById('nav-booking');
        const navDashboard = document.getElementById('nav-dashboard');

    const navHousekeeping = document.getElementById('nav-housekeeping');
        const navRates = document.getElementById('nav-inventory');

    const navReports = document.getElementById('nav-reports');
    const navServiceReports = document.getElementById('nav-service-reports');
    const navCalendar = document.getElementById('nav-calendar');
    const navAuditLogs = document.getElementById('nav-audit-logs');
    const navChannelManager = document.getElementById('nav-channel-manager');

    if (navBooking) {
        navBooking.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('booking-management');
        });
    }
    if (navDashboard) {
        navDashboard.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            showSection('dashbaord');
        });
    }
   

    if (navReports) {
        navReports.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('reports');
        });
    }
    
        if (navRates) {
        navRates.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('inventory');
        });
    }


     if (navHousekeeping) {
        navHousekeeping.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('housekeeping');
        });
    }

    
    if (navServiceReports) {
        navServiceReports.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('service-reports');
        });
    }

    if (navCalendar) {
        navCalendar.addEventListener('click', (e) => {
            e.preventDefault();
           showSection('calendar');
       });
    }

    if (navAuditLogs) {
        navAuditLogs.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('audit-logs');
        });
    }

    if (navChannelManager) {
        navChannelManager.addEventListener('click', (e) => {
            e.preventDefault();
           showSection('channel-manager');
       });
    }});
    
    function showMessageBox(title, content) {
    document.getElementById('messageBoxTitle').textContent = title;
    document.getElementById('messageBoxContent').textContent = content;

    // Show both the overlay and the box
    document.getElementById('messageBoxOverlay').classList.remove('hidden');
    document.getElementById('messageBox').classList.remove('hidden');
}

function closeMessageBox() {
    // Hide both
    document.getElementById('messageBoxOverlay').classList.add('hidden');
    document.getElementById('messageBox').classList.add('hidden');
}
