import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://127.0.0.1:5000/api';

const runTest = async () => {
    try {
        const timestamp = Date.now();
        const newUser = {
            name: `Test User ${timestamp}`,
            email: `test${timestamp}@example.com`,
            password: 'password123'
        };

        console.log(`1. Retistering new user: ${newUser.email}`);
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        const regData = await regRes.json();

        if (!regRes.ok) {
            console.error("❌ Registration Failed:", regData);
            return;
        }

        if (!regData.token) {
            console.error("❌ FAILED: No token received in registration response.");
            return;
        }
        console.log("✅ Registration successful. Token received.");
        const token = regData.token;

        // 2. Access Protected Route /auth/me with Bearer Token
        console.log("2. Testing /auth/me with Bearer token...");
        const meRes = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (meRes.ok) {
            console.log("✅ /auth/me access successful with Bearer token.");
        } else {
            console.error("❌ /auth/me failed:", await meRes.json());
        }

        // 3. Access Admin Route (Expect 403 or 200 if admin)
        console.log("3. Testing /admin/stats with Bearer token (Expect 403)...");
        const statsRes = await fetch(`${API_URL}/admin/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (statsRes.status === 403) {
            console.log("✅ Got 403 Forbidden as expected (Token valid, Role invalid).");
        } else if (statsRes.ok) {
            console.log("⚠️ Got 200 OK (Unexpected for student, but Token valid).");
        } else if (statsRes.status === 401) {
            console.error("❌ Got 401 Unauthorized (Token NOT rejected/missing). Test Failed.");
        } else {
            console.log(`ℹ️ Got status ${statsRes.status}`);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
};

runTest();
