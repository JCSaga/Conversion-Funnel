const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
dayjs.extend(weekOfYear);

const fs = require("fs");
const path = require("path");
const { getDeals } = require("./hubspot");

function bucketCountry(raw) {
    if (!raw) return "United Kingdom + Other Countries";
    const c = raw.trim();

    if (c === "United Arab Emirates") return "United Arab Emirates";
    if (c === "South Africa") return "South Africa";
    if (c === "Jordan") return "Jordan";

    return "United Kingdom + Other Countries";
}

function getDayKey(ts) {
    return dayjs(ts).format("YYYY-MM-DD");
}

async function buildChurn() {
    const deals = await getDeals();
    console.log("Deals fetched for churn:", deals.length);

    const temp = {};

    for (const deal of deals) {
        const p = deal.properties || {};
        const country = bucketCountry(p.country_of_residence);
        temp[country] ??= {};

        // ✅ ONBOARDED → membership_start_date
        if (p.membership_start_date) {
            const key = getDayKey(p.membership_start_date);
            temp[country][key] ??= { onboarded: 0, offboarded: 0 };
            temp[country][key].onboarded++;
        }

        // ✅ OFFBOARDED → membership_end_date
        if (p.membership_end_date) {
            const key = getDayKey(p.membership_end_date);
            temp[country][key] ??= { onboarded: 0, offboarded: 0 };
            temp[country][key].offboarded++;
        }
    }

    const result = {};
    for (const country in temp) {
        result[country] = Object.entries(temp[country])
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, values]) => ({
                label,
                onboarded: values.onboarded,
                offboarded: values.offboarded
            }));
    }

    const filePath = path.join(__dirname, "data", "churn.json");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));

    console.log(`✅ Accurate churn computed → ${filePath}`);
}

buildChurn();
