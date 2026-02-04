const testApi = async () => {
    try {
        const res = await fetch('http://localhost:5005/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'tatajikomaragiri@gmail.com',
                password: 'nani@1432'
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Data:', data);
    } catch (err) {
        console.error('Fetch Error:', err);
    }
};

testApi();
