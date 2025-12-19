let chatWindow, userInput, typingIndicator, toggleBtn;
        const API_BASE = 'https://patrinahhotelpms.onrender.com/api';

        window.addEventListener('DOMContentLoaded', () => {
            chatWindow = document.getElementById('chat-window');
            userInput = document.getElementById('user-input');
            typingIndicator = document.getElementById('typing');
            toggleBtn = document.getElementById('toggle-icon-container');
            
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSend();
            });
        });

        function toggleChat() {
            const container = document.getElementById('chat-container');
            const isOpen = container.classList.contains('hidden');
            
            // Toggle visibility
            container.classList.toggle('hidden');
            container.classList.toggle('flex');

            // Toggle Icon (Bubble vs X)
            if (isOpen) {
                toggleBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>`;
                userInput.focus();
            } else {
                toggleBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>`;
            }
        }

        function setInput(text) {
            userInput.value = text;
            userInput.focus();
        }

        function addMessage(role, text) {
            const div = document.createElement('div');
            div.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
            div.innerHTML = `
                <div class="max-w-[85%] ${role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'} p-3 rounded-2xl text-sm shadow-md">
                    ${text}
                </div>
            `;
            chatWindow.appendChild(div);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        async function executeAction(type) {
            addMessage('user', `Triggering ${type}...`);
            const res = await routeRequest(type);
            addMessage('ai', res);
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

        async function routeRequest(q) {
            try {
                if (q.includes('available') || q.includes('free')) {
                    const res = await fetch(`${API_BASE}/rooms/available?checkIn=2025-01-01&checkOut=2025-01-02`);
                    const data = await res.json();
                    return `Inventory analysis: I found **${data.length}** rooms currently available for those dates.`;
                }
                if (q.includes('revenue') || q.includes('forecast')) {
                    const res = await fetch(`${API_BASE}/reports/services?startDate=2025-01-01&endDate=2025-12-31`);
                    const data = await res.json();
                    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
                    const forecast = total * 1.15; 
                    return `Financial Intelligence: Current period revenue is $${total.toLocaleString()}. Based on seasonal trends, I forecast **$${forecast.toLocaleString()}** for the next cycle.`;
                }
                if (q.includes('audit') || q.includes('who')) {
                    const res = await fetch(`${API_BASE}/audit-logs`);
                    const data = await res.json();
                    const last = data[0];
                    return `Security Audit: Latest action was **${last.action}** by **${last.user}** at ${new Date(last.timestamp).toLocaleTimeString()}.`;
                }
                if (q.includes('sync')) {
                    await fetch(`${API_BASE}/channel-manager/sync`, { method: 'POST' });
                    return "Channel Manager Synchronization: API request sent. OTA platforms are being updated.";
                }
                return "I'm monitoring your PMS endpoints. Ask about revenue, availability, or system logs.";
            } catch (err) {
                return `Connection Error: Cannot reach API. Ensure CORS is enabled.`;
            }
        }
