const { getDeals } = require("./hubspot");

(async () => {
  const deals = await getDeals();
  console.log("Total deals:", deals.length);

  const props = Object.keys(deals[0].properties);
  console.log("\n==== PROPERTY KEYS FOUND ====\n");
  console.log(props);

  console.log("\n==== DATE_ENTERED FIELDS ====\n");
  props.filter(p => p.includes("entered")).forEach(p => console.log(p));

  console.log("\n==== JOIN / WAITLIST MATCHES ====\n");
  props.filter(p => p.toLowerCase().includes("wait") || p.toLowerCase().includes("join"))
      .forEach(p => console.log(p));
})();