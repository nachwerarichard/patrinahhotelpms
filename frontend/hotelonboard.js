    const API_BASE_URL = 'https://patrinahhotelpms.onrender.com/api';

    document.getElementById('publicOnboardForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorText = document.getElementById('passwordError');

        // Client-side Match Check
        if (password !== confirmPassword) {
            errorText.classList.remove('hidden');
            return;
        } else {
            errorText.classList.add('hidden');
        }

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.textContent = "Setting up your property...";

        const hotelData = {
            name: document.getElementById('name').value,
            location: document.getElementById('location').value,
            domainName: document.getElementById('domainName').value,
            email: document.getElementById('email').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            password: password,
            confirmPassword: confirmPassword
        };

        try {
            const response = await fetch(`${API_BASE_URL}/public/hotel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hotelData)
            });

            const data = await response.json();

            if (response.ok) {
                document.getElementById('registrationContainer').classList.add('hidden');
                document.getElementById('successState').classList.remove('hidden');
                // Update success message text to remove the "admin" password reference
                document.querySelector('#successState p').innerHTML = `Your property is being indexed. You may now log in using your <span class="font-bold text-slate-800">Email Address</span> and the password you just created.`;
            } else {
                alert(data.error || "Onboarding failed");
            }
        } catch (err) {
            alert("Network error. Please try again.");
        } finally {
            btn.disabled = false;
            btn.textContent = "Create Partner Account";
        }
    });



