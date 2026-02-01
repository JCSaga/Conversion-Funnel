const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");

dayjs.extend(weekOfYear);
dayjs.extend(isSameOrAfter);

const fs = require("fs");
const path = require("path");
const { getDeals } = require("./hubspot");
const { ORDERED_FUNNEL, STAGE_NAMES, FUNNEL_STAGES } = require("./config");


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
  if (!raw) return "United Kingdom + Other Countries";
  const c = raw.trim();

  if (c === "United Arab Emirates") return "United Arab Emirates";
  if (c === "South Africa") return "South Africa";
  if (c === "Jordan") return "Jordan";

  return "United Kingdom + Other Countries";
}

async function buildFunnel() {
  const deals = await getDeals();
  console.log("Deals fetched:", deals.length);

  const cohorts = {};

  for (const deal of deals) {
    const props = deal.properties || {};
    const joinedTs = props[`hs_v2_date_entered_${FUNNEL_STAGES.JOINED_WAITLIST}`];
    if (!joinedTs) continue;

    const keys = [
      getWeek(joinedTs),
      getMonth(joinedTs),
      getYear(joinedTs)
    ];

    const country = bucketCountry(props.country_of_residence);

    keys.forEach(key => {
      cohorts[key] ??= {};
      cohorts[key][country] ??= [];
      cohorts[key][country].push(props);
    });

  }

  const result = {};

  for (const month in cohorts) {
    result[month] = {};

    for (const country in cohorts[month]) {
      const deals = cohorts[month][country];

      const counts = {};
      ORDERED_FUNNEL.forEach(s => counts[s] = 0);

      for (const props of deals) {
        ORDERED_FUNNEL.forEach((stage, i) => {
          const ts = props[`hs_v2_date_entered_${stage}`];
          if (!ts) return;

          const entered = dayjs(ts);
          const cohortStart =
            month.includes("-W")
              ? dayjs()
                .year(Number(month.split("-W")[0]))
                .week(Number(month.split("-W")[1]))
                .startOf("week")// Sunday start
              : month.length === 4
                ? dayjs(`${month}-01-01`)
                : dayjs(`${month}-01`);

          if (entered.isSameOrAfter(cohortStart)) {
            counts[stage]++;
          }

        });
      }

      const cohortSize = counts[ORDERED_FUNNEL[0]];
      result[month][country] = {
        cohortSize,
        stages: {}
      };

      ORDERED_FUNNEL.forEach((stage, idx) => {
        const current = counts[stage];
        const prev = idx === 0 ? current : counts[ORDERED_FUNNEL[idx - 1]];

        result[month][country].stages[stage] = {
          name: STAGE_NAMES[stage],
          count: current,
          conversion_prev: prev === 0 ? 0 : current / prev,
          conversion_cohort: cohortSize === 0 ? 0 : current / cohortSize,
          drop: prev - current
        };
      });
    }
  }

  const filePath = path.join(__dirname, "data", "funnels.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
  console.log(`Funnels computed → ${filePath}`);
}

buildFunnel();