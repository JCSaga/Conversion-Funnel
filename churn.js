const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);

const fs = require("fs");
const path = require("path");
const { getDeals } = require("./hubspot");

const MEMBER_STAGE = "36053576";      // Member (Membership)
const EX_MEMBER_STAGE = "41889204";   // Ex-Member (Non Members)

function bucketCountry(raw) {
    if (!raw) return "United Kingdom + Other";
    const c = raw.trim();

    if (c === "United Arab Emirates") return "United Arab Emirates";
    if (c === "South Africa") return "South Africa";
    if (c === "Jordan") return "Jordan";

    return "United Kingdom + Other";
}

function getWeekKey(ts) {
    const d = dayjs(ts);
    return `${d.isoWeekYear()}-W${d.isoWeek()}`;
}

function getMonthKey(ts) {
    return dayjs(ts).format("YYYY-MM");
}

async function buildChurn() {
    const deals = await getDeals();
    console.log("Deals fetched for churn:", deals.length);

    const temp = {};

    for (const deal of deals) {
        const p = deal.properties || {};
        const country = bucketCountry(p.country_of_residence);
        temp[country] ??= {};

        // ✅ ONBOARDED (entered Member)
        const onboardedTs = p[`hs_v2_date_entered_${MEMBER_STAGE}`];
        if (onboardedTs) {
            const key = getWeekKey(onboardedTs);
            temp[country][key] ??= { onboarded: 0, offboarded: 0 };
            temp[country][key].onboarded++;
        }

        // ✅ OFFBOARDED (entered Ex-Member)
        const offboardedTs = p[`hs_v2_date_entered_${EX_MEMBER_STAGE}`];
        if (offboardedTs) {
            const key = getWeekKey(offboardedTs);
            temp[country][key] ??= { onboarded: 0, offboarded: 0 };
            temp[country][key].offboarded++;
        }
    }

    // Sort by year + week
    const result = {};
    for (const country in temp) {
        result[country] = Object.entries(temp[country])
            .sort(([a], [b]) => {
                const [ay, aw] = a.split("-W").map(Number);
                const [by, bw] = b.split("-W").map(Number);
                if (ay !== by) return ay - by;
                return aw - bw;
            })
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
