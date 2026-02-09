const API_URL = 'http://localhost:5000/api';

const runVerification = async () => {
    console.log("🚀 Starting Submit Exam Verification...");

    // CHECK: POST /api/admin/submit-exam
    console.log("\n🔍 Checking POST /api/admin/submit-exam...");
    try {
        const res = await fetch(`${API_URL}/admin/submit-exam`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examId: 1, answers: [] })
        });

        if (res.status === 404) {
            console.error("❌ Route MISSING! (Got 404 Not Found)");
        } else if (res.status === 401) {
            console.log("✅ Route works! (Got 401 Unauthorized, meaning endpoint exists and is protected)");
        } else {
            console.log(`✅ Route responded with ${res.status} (Endpoint exists)`);
        }
    } catch (err) {
        console.error("❌ Connection Failed.", err.cause || err.message);
    }
};

runVerification();
