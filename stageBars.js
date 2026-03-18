const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
const fs = require("fs");
const path = require("path");

dayjs.extend(weekOfYear);

const { getDeals } = require("./hubspot");
const { ORDERED_FUNNEL, STAGE_NAMES } = require("./config");

function getWeek(ts) {
  const d = dayjs(ts);
  return `${d.year()}-W${String(d.week()).padStart(2, "0")}`;
}

function getMonth(ts) {
  return dayjs(ts).format("YYYY-MM");
}

function getYear(ts) {
  return dayjs(ts).format("YYYY");
}

function bucketCountry(raw) {
  if (!raw) return "Other Countries";

  const c = raw.trim();

  if (c === "United Kingdom") return "United Kingdom";
  if (c === "United Arab Emirates") return "United Arab Emirates";
  if (c === "South Africa") return "South Africa";
  if (c === "Jordan") return "Jordan";

  return "Other Countries";
}

async function buildStageBars() {
  const deals = await getDeals();
  console.log("Deals fetched:", deals.length);

  const result = {};

  for (const deal of deals) {
    const props = deal.properties || {};
    const country = bucketCountry(props.country_of_residence);

    ORDERED_FUNNEL.forEach(stage => {

      const ts = props[`hs_v2_date_entered_${stage}`];
      if (!ts) return;

      const keys = [
        getWeek(ts),
        getMonth(ts),
        getYear(ts)
      ];

      keys.forEach(key => {

        result[key] ??= {};
        result[key][country] ??= {};

        ORDERED_FUNNEL.forEach(s => {
          result[key][country][s] ??= {
            name: STAGE_NAMES[s],
            count: 0
          };
        });

        result[key][country][stage].count++;

      });

    });
  }

  const filePath = path.join(__dirname, "data", "stageBars.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));

  console.log(`Stage bars computed → ${filePath}`);
}

buildStageBars();