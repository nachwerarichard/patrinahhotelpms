    (function autoLoginHook() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('autoLogin') === 'true') {
        // 1. Inject CSS with your custom preloader
        const style = document.createElement('style');
        style.id = 'auto-login-styles';
        style.innerHTML = `
            #auto-login-overlay {
                position: fixed; 
                top: 0; left: 0; 
                width: 100%; height: 100%;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(20px); 
                -webkit-backdrop-filter: blur(20px);
                display: flex; 
                justify-content: center; 
                align-items: center;
                z-index: 999999; 
                transition: opacity 0.5s ease;
            }

            /* YOUR CUSTOM PRELOADER */
            .loader {
                --d: 22px;
                width: 4px;
                height: 4px;
                border-radius: 50%;
                color: #25b09b;
                box-shadow: 
                    calc(1 * var(--d))     calc(0 * var(--d))     0 0,
                    calc(0.707 * var(--d)) calc(0.707 * var(--d)) 0 1px,
                    calc(0 * var(--d))     calc(1 * var(--d))     0 2px,
                    calc(-0.707 * var(--d)) calc(0.707 * var(--d)) 0 3px,
                    calc(-1 * var(--d))    calc(0 * var(--d))     0 4px,
                    calc(-0.707 * var(--d)) calc(-0.707 * var(--d)) 0 5px,
                    calc(0 * var(--d))     calc(-1 * var(--d))    0 6px;
                animation: l27 1s infinite steps(8);
            }

            @keyframes l27 {
                100% { transform: rotate(1turn); }
            }
        `;
        document.head.appendChild(style);

        // 2. Create Overlay
        const overlay = document.createElement('div');
        overlay.id = 'auto-login-overlay';
        overlay.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(overlay);

        // 3. Cleanup Logic
        const removeOverlay = () => {
            const el = document.getElementById('auto-login-overlay');
            if (el) {
                el.style.opacity = '0'; // Smooth fade out
                setTimeout(() => el.remove(), 500); 
            }
        };

        // 4. Auto-Login Logic
        const user = urlParams.get('u');
        const pass = urlParams.get('p');
        
        
        const userField = document.querySelector('input[type="text"]') || document.getElementById('username');
        const passField = document.querySelector('input[type="password"]') || document.getElementById('password');
        const loginBtn = document.querySelector('button[type="submit"]') || document.getElementById('login-button');

        if (userField && passField && loginBtn) {
            userField.value = user;
            passField.value = pass;

            // Clear URL so credentials aren't leaked in history
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({path: cleanUrl}, '', cleanUrl);

            setTimeout(() => {
                loginBtn.click();
                
                // --- WATCHDOG START ---
                const checkFinished = setInterval(() => {
                    const stillOnLoginPage = document.querySelector('input[type="password"]');
                    // If password field is gone, we've moved to the dashboard
                    if (!stillOnLoginPage) {
                        removeOverlay();
                        clearInterval(checkFinished);
                    }
                }, 500);

                // Safety timeout: 5 seconds max
                setTimeout(() => {
                    removeOverlay();
                    clearInterval(checkFinished);
                }, 5000);
                // --- WATCHDOG END ---

            }, 500);
        } else {
            removeOverlay(); // Remove if login fields aren't found
        }
    }
})();

// Save to storage
localStorage.setItem('hotel_username', currentUsername);

// Also update the display immediately
const displayElement = document.getElementById('display-user-name');
if (displayElement) {
    displayElement.textContent = currentUsername;
}
document.addEventListener('DOMContentLoaded', () => {
    // Attempt to get the name from storage
    const savedUsername = localStorage.getItem('hotel_username');

    if (savedUsername) {
        // Set the global variable so your other functions can use it
        currentUsername = savedUsername; 

        // Update the display element
        const displayElement = document.getElementById('display-user-name');
        if (displayElement) {
            displayElement.textContent = savedUsername;
        }
    } else {
        // Optional: Redirect to login if no username is found
        // window.location.href = 'login.html';
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

function logout() {
    // 1. Clear session data
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user'); // Clear everything else too
   localStorage.removeItem('hotel_username');
    // 2. Log for debugging
    console.log("Session cleared. Redirecting...");

    // 3. Replace current history entry with the login page
    // This makes it impossible to "go back" to the dashboard
    window.location.replace('https://elegant-pasca-cea136.netlify.app/frontend/login.html');
}
    
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
