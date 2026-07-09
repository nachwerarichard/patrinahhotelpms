const API_URL = 'https://patrinahhotelpms.onrender.com/api';
// The single destination for all users
const MAIN_SYSTEM_URL = 'https://elegant-pasca-cea136.netlify.app/frontend/home12.html';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-button');
    const err = document.getElementById('error-message');
    
    btn.disabled = true;
    btn.innerHTML = `<span class="flex items-center justify-center gap-2">Verifying Credentials...</span>`;
    err.classList.add('hidden');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        let response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }) 
        });

        const result = await response.json();

        if (response.ok) {
            const user = result.user; // Data from your Node.js res.json
            const token = result.token; // Your Base64 token
            
            // 1. LOGGING: Very important for debugging the "null" issue
            console.log("Full User Object from Backend:", user);

            // 2. EXTRACTION: Get the specific fields
            const username = user.username;
            const role = (user.role || '').toLowerCase();
            const hotelId = user.hotelId || "";
            const hotelName = user.hotelName || "Our Hotel"; 
            
            // ➔ EXTRACT GLOBAL CURRENCY: Match the key returned from your updated backend model
            const hotelCurrency = user.hotelCurrency || "UGX"; 

            // 3. URL CONSTRUCTION: Encode everything to handle spaces/special characters
            const secureParams = `?autoLogin=true` +
                `&u=${encodeURIComponent(username)}` +
                `&t=${encodeURIComponent(token)}` +
                `&n=${encodeURIComponent(hotelName)}` + 
                `&r=${encodeURIComponent(role)}` +
                `&h=${encodeURIComponent(hotelId)}` +
                `&c=${encodeURIComponent(hotelCurrency)}`; // ➔ ADDED: 'c' is for Currency

            // 4. FEEDBACK: Show the user something is happening
            if (btn) {
                btn.innerHTML = `<span class="flex items-center justify-center gap-2">Access Granted. Redirecting...</span>`;
                btn.classList.replace('bg-slate-900', 'bg-emerald-600');
            }

            // 5. REDIRECT: Send to the dashboard
            console.log("Redirecting to:", `${MAIN_SYSTEM_URL}${secureParams}`);
            window.location.replace(`${MAIN_SYSTEM_URL}${secureParams}`);
        } else {
            err.textContent = result.message || 'Authentication failed.';
            err.classList.remove('hidden');
        }
    } catch (error) {
        err.textContent = 'Server unreachable. Check your connection.';
        err.classList.remove('hidden');
    } finally {
        if (typeof response === 'undefined' || !response?.ok) {
            btn.disabled = false;
            btn.textContent = 'Secure Login';
        }
    }
});