import pool from "./config/db.js";

const email = process.argv[2];

if (!email) {
    console.error("Please provide an email: node promote_admin.js email@example.com");
    process.exit(1);
}

const promote = async () => {
    try {
        const res = await pool.query(
            "UPDATE public.users SET role = 'admin' WHERE email = $1 RETURNING id, name, email, role",
            [email]
        );

        if (res.rows.length === 0) {
            console.error("❌ User not found");
        } else {
            console.log("✅ User promoted successfully:", res.rows[0]);
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ Promotion failed:", err.message);
        process.exit(1);
    }
};

promote();
