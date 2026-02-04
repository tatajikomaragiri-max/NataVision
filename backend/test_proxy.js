
const registerProxy = async () => {
    const uniqueId = Date.now();
    const userData = {
        name: `Proxy User ${uniqueId}`,
        email: `proxy${uniqueId}@example.com`,
        password: "password123"
    };

    // Try ports 5173, 5174, 5175 to find the active frontend
    const ports = [5173, 5174, 5175, 5176];

    for (const port of ports) {
        console.log(`Testing Proxy on Port ${port}...`);
        try {
            const response = await fetch(`http://localhost:${port}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            const text = await response.text();
            console.log(`Status: ${response.status}`);

            try {
                const data = JSON.parse(text);
                if (response.ok) {
                    console.log(`✅ Proxy Registration SUCCESS on port ${port}`);
                    console.log("Response:", data);
                    return; // Success
                } else {
                    console.log(`❌ Proxy Registration FAILED on port ${port}`);
                    console.log("Error:", data);
                }
            } catch (e) {
                console.log("Non-JSON Response (likely HTML):", text.substring(0, 100));
            }
        } catch (error) {
            console.log(`❌ Connection failed to port ${port}:`, error.message);
        }
    }
};

registerProxy();
