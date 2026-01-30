const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const app = express();

app.use(express.static('public'));
app.use(express.json());

// GET funnel data
app.get('/data', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'funnels.json');
    try {
        const json = JSON.parse(fs.readFileSync(filePath));
        res.json(json);
    } catch (e) {
        res.status(500).json({ ok: false });
    }
});

// ✅ GET churn data
app.get('/churn', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'churn.json');
    try {
        const json = JSON.parse(fs.readFileSync(filePath));
        res.json(json);
    } catch (e) {
        res.status(500).json({ ok: false });
    }
});

// Refresh funnel + churn
app.post('/refresh', (req, res) => {
    console.log("Refreshing funnel + churn...");

    exec('node funnel.js && node churn.js', (err, stdout) => {
        if (err) {
            return res.status(500).json({ ok: false });
        }

        res.json({ ok: true });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
