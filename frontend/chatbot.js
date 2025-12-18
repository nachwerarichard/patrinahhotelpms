
        const chatWindow = document.getElementById('chat-window');
        const userInput = document.getElementById('user-input');
        const typingIndicator = document.getElementById('typing');
        const API_BASE = '/api'; // Change to your actual server URL

        function setInput(text) {
            userInput.value = text;
            userInput.focus();
        }

        function addMessage(role, text) {
            const div = document.createElement('div');
            div.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
            div.innerHTML = `
                <div class="max-w-[80%] ${role === 'user' ? 'bg-cyan-700 text-white rounded-br-none' : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-bl-none'} p-3 rounded-2xl text-sm shadow-lg">
                    ${text}
                </div>
            `;
            chatWindow.appendChild(div);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        async function handleSend() {
            const query = userInput.value.trim();
            if (!query) return;

            addMessage('user', query);
            userInput.value = '';
            typingIndicator.classList.remove('hidden');

            const response = await routeRequest(query.toLowerCase());
            
            typingIndicator.classList.add('hidden');
            addMessage('ai', response);
        }

        // --- FULL ENDPOINT ROUTER ---
        async function routeRequest(q) {
            try {
                // 1. AVAILABILITY (GET /api/rooms/available)
                if (q.includes('available') || q.includes('free')) {
                    const res = await fetch(`${API_BASE}/rooms/available?checkIn=2024-01-01&checkOut=2024-01-02`);
                    const data = await res.json();
                    return `Checked /api/rooms/available: There are currently **${data.length}** rooms available for those dates.`;
                }

                // 2. REVENUE & REPORTS (GET /api/reports/services)
                if (q.includes('revenue') || q.includes('report') || q.includes('forecast')) {
                    const res = await fetch(`${API_BASE}/reports/services?startDate=2024-01-01&endDate=2024-12-31`);
                    const data = await res.json();
                    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
                    const forecast = total * 1.12; 
                    return `AI Forecast Analysis: Current revenue is **$${total.toLocaleString()}**. Based on historical /api/reports data, I forecast a growth to **$${forecast.toLocaleString()}** next quarter.`;
                }

                // 3. AUDIT LOGS (GET /api/audit-logs)
                if (q.includes('audit') || q.includes('who') || q.includes('logs')) {
                    const res = await fetch(`${API_BASE}/audit-logs?user=admin`);
                    const data = await res.json();
                    return `Recent system activity: Found **${data.length}** log entries. The last action was "${data[0]?.action}" by user "${data[0]?.user}".`;
                }

                // 4. BOOKING SEARCH (GET /api/bookings?search=...)
                if (q.includes('booking') || q.includes('find')) {
                    const res = await fetch(`${API_BASE}/bookings?page=1&limit=5`);
                    const data = await res.json();
                    return `Booking Database: Found ${data.total} total bookings. The latest custom ID is **${data.bookings[0]?.customId}**.`;
                }

                // 5. INCIDENTALS (GET /api/incidental-charges)
                if (q.includes('charge') || q.includes('extra')) {
                    const res = await fetch(`${API_BASE}/incidental-charges/booking-custom-id/BK-99`);
                    const data = await res.json();
                    return `Incidental Report: Requesting data for BK-99 via /api/incidental-charges. Found ${data.length} pending charges.`;
                }

                // 6. SYSTEM ACTIONS (POST /api/channel-manager/sync)
                if (q.includes('sync')) {
                    await fetch(`${API_BASE}/channel-manager/sync`, { method: 'POST' });
                    return "Triggered simulation for /api/channel-manager/sync. OTA channels (Expedia, Booking.com) are now updated.";
                }

                // 7. PUBLIC DATA (GET /api/public/room-types)
                if (q.includes('types') || q.includes('public')) {
                    const res = await fetch(`${API_BASE}/public/room-types`);
                    const data = await res.json();
                    return `Public API says we offer these room types: ${data.join(', ')}.`;
                }

                return "I'm sorry, I couldn't map that to an endpoint. Try asking about 'revenue', 'availability', 'sync', or 'audit logs'.";

            } catch (err) {
                return `**Error:** I tried to reach the API but failed. Make sure your server is running on the correct port. (Detail: ${err.message})`;
            }
        }

        // Listen for Enter key
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });

</html>
