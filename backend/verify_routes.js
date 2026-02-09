const API_URL = 'http://localhost:5000/api';

const runVerification = async () => {
    console.log("🚀 Starting Backend Verification (ESM/Fetch)...");

    // CHECK 1: GET /api/admin/exams/:id/questions
    console.log("\n🔍 Checking GET /api/admin/exams/1/questions...");
    try {
        const res = await fetch(`${API_URL}/admin/exams/1/questions`);

        if (res.status === 404) {
            // We expect 404 "Exam not found" or 401 "Not authorized"
            // We need to read the body to see if it's the API 404 or Express 404
            const data = await res.json().catch(() => ({}));
            if (data.message === "Exam not found") {
                console.log("✅ Route works! (Got 404 'Exam not found' logic from controller)");
            } else if (res.statusText === "Not Found") {
                console.error("⚠️  Got generic 404. Route might be missing or auth middleware blocking differently.");
                console.log("Response:", data);
            }
        } else if (res.status === 401) {
            console.log("✅ Route works! (Got 401 Unauthorized, meaning endpoint exists and is protected)");
        } else {
            console.log(`✅ Route responded with ${res.status} (Endpoint exists)`);
        }
    } catch (err) {
        console.error("❌ Connection Failed. Is backend running?", err.cause || err.message);
    }

    // CHECK 2: GET /api/admin/my-results
    console.log("\n🔍 Checking GET /api/admin/my-results...");
    try {
        const res = await fetch(`${API_URL}/admin/my-results`);
        if (res.status === 401) {
            console.log("✅ Route works! (Got 401 Unauthorized, meaning endpoint exists and is protected)");
        } else if (res.status === 404) {
            console.error("❌ Route MISSING! (Got 404 Not Found)");
        } else {
            console.log(`✅ Route responded with ${res.status} (Endpoint exists)`);
        }
    } catch (err) {
        console.error("❌ Connection Failed.", err.cause || err.message);
    }
};

runVerification();
