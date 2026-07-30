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
        const user = result.user;
        const token = result.token;
        
        console.log("Full User Object from Backend:", user);

        // 1. EXTRACTION: Get fields including hotelLocation
        const username = user.username;
        const role = (user.role || '').toLowerCase();
        const hotelId = user.hotelId || "";
        const hotelName = user.hotelName || "Our Hotel"; 
        const hotelLocation = user.hotelLocation || "Main Campus"; // 📍 EXTRACT LOCATION
        const hotelCurrency = user.hotelCurrency || "UGX"; 

        // 2. URL CONSTRUCTION: Added '&l=' for location
        const secureParams = `?autoLogin=true` +
            `&u=${encodeURIComponent(username)}` +
            `&t=${encodeURIComponent(token)}` +
            `&n=${encodeURIComponent(hotelName)}` + 
            `&l=${encodeURIComponent(hotelLocation)}` + // 📍 ADDED: 'l' is for Location
            `&r=${encodeURIComponent(role)}` +
            `&h=${encodeURIComponent(hotelId)}` +
            `&c=${encodeURIComponent(hotelCurrency)}`;

        // 3. FEEDBACK
        if (btn) {
            btn.innerHTML = `<span class="flex items-center justify-center gap-2">Access Granted. Redirecting...</span>`;
            btn.classList.replace('bg-slate-900', 'bg-emerald-600');
        }

        // 4. REDIRECT
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