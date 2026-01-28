const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(express.static('public'));

app.get('/data', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'funnels.json');
    res.json(JSON.parse(fs.readFileSync(filePath)));
});

app.post('/refresh', (req, res) => {
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
            stdout
        });
    });
});


app.listen(3000, () => console.log("Running at http://localhost:3000"));