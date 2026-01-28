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
        console.error("Error reading funnels.json:", e);
        res.status(500).json({ ok: false, message: "Could not read data." });
    }
});

// Refresh funnel data
app.post('/refresh', (req, res) => {
    console.log("Running funnel.js to refresh data...");

    exec('node funnel.js', (err, stdout, stderr) => {
        if (err) {
            console.error("Refresh error:", err);
            return res.status(500).json({
                ok: false,
                message: "Refresh failed",
                error: err.toString()
            });
        }

        console.log("Refresh completed");
        res.json({
            ok: true,
            message: "Refresh successful",
            output: stdout
        });
    });
});

// Dynamic port for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
