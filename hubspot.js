const axios = require("axios");
const { HUBSPOT_TOKEN, ORDERED_FUNNEL } = require("./config");
const EX_MEMBER_STAGE = "41889204";

const hs = axios.create({
  baseURL: "https://api.hubapi.com",
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    "Content-Type": "application/json"
  }
});

async function getDeals() {
  const deals = [];
  let after = undefined;

  const props = [
    "dealstage",
    "pipeline",
    "createdate",
    "country_of_residence",
    "membership_start_date",
    "membership_end_date",
    `hs_v2_date_entered_${EX_MEMBER_STAGE}`,
    ...ORDERED_FUNNEL.map(id => `hs_v2_date_entered_${id}`)
  ].join(",");


  while (true) {
    const params = { limit: 100, properties: props };
    if (after) params.after = after;

    const res = await hs.get("/crm/v3/objects/deals", { params });

    deals.push(...res.data.results);

    if (!res.data.paging) break;
    after = res.data.paging.next.after;
  }

  return deals;
}

module.exports = { getDeals };