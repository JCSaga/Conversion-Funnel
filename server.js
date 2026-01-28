const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const app = express();

// Allow static frontend files
app.use(express.static('public'));

// Allow JSON bodies (good practice)
app.use(express.json());

// Optional: CORS support in case frontend is separate
const cors = require('cors');
app.use(cors());

// ===== GET CURRENT FUNNEL DATA =====
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

// ===== REFRESH DATA BUTTON =====
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

// ===== DYNAMIC PORT FOR DEPLOYMENT =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
