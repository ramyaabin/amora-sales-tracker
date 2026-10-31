/**
 * Import the demo dataset CSVs into MongoDB.
 *
 * Usage (from sales-backend/):
 *   node scripts/importDemoData.js <csvFolder> --db <dbName> --products
 *   node scripts/importDemoData.js <csvFolder> --db <dbName> --all
 *
 *   --products  replace only the products collection
 *   --all       replace products, sales, leaves and users (demo database only!)
 *
 * The connection string comes from MONGO_URI in .env; --db picks the database.
 */
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import XLSX from "xlsx";

dotenv.config();

const [folder, ...flags] = process.argv.slice(2);
const dbName = flags[flags.indexOf("--db") + 1];
const mode = flags.includes("--all") ? "all" : flags.includes("--products") ? "products" : null;

if (!folder || !flags.includes("--db") || !dbName || !mode) {
  console.error("Usage: node scripts/importDemoData.js <csvFolder> --db <dbName> --products|--all");
  process.exit(1);
}
// Safety: never load fictional sales/users into the live database
if (mode === "all" && dbName === "test") {
  console.error("Refusing to load demo sales/users into the live 'test' database.");
  process.exit(1);
}

// Read a CSV keeping every value as text (keeps barcodes and dates exactly as written)
const readCsv = (file) => {
  const text = fs.readFileSync(path.join(folder, file), "utf8");
  const wb = XLSX.read(text, { type: "string", raw: true });
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: true, defval: "" });
};
const clean = (v) => String(v ?? "").replace(/\s*\n\s*/g, " ").trim();

const productRows = readCsv("product_catalog_demo.csv");
const products = productRows.map((r) => ({
  brand: clean(r.brand),
  itemCode: clean(r.sku),
  modelNumber: clean(r.model_number),
  ean: clean(r.ean),
  description: clean(r.product_name),
  price: Number(r.list_price_aed) || 0,
  rspVat: Number(r.list_price_aed) || 0,
  department: clean(r.department),
  status: clean(r.product_status) || "Active",
  isActive: true,
}));

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.useDb(dbName).db;
console.log(`Connected → database "${dbName}" (mode: ${mode})`);

await db.collection("products").deleteMany({});
await db.collection("products").insertMany(products);
console.log(`✅ products: ${products.length} inserted`);

if (mode === "all") {
  // Barcode lookup so each sale carries the product's EAN
  const eanById = Object.fromEntries(productRows.map((r) => [r.product_id, clean(r.ean)]));

  const sales = readCsv("sales_transactions_demo.csv").map((r) => ({
    salesmanId: clean(r.salesperson_id),
    salesmanName: clean(r.salesperson_name),
    date: clean(r.sale_date), // YYYY-MM-DD, as the app expects
    location: clean(r.outlet_name),
    brand: clean(r.brand),
    itemCode: clean(r.sku),
    barcode: eanById[r.product_id] || "",
    description: clean(r.product_name),
    quantity: Number(r.quantity),
    price: Number(r.unit_selling_price_aed),
    totalAmount: Number(r.total_sales_aed),
    timestamp: new Date(`${clean(r.sale_date)}T12:00:00Z`),
  }));
  const leaves = buildDemoLeaves(sales);
  await db.collection("leaves").deleteMany({});
  await db.collection("leaves").insertMany(leaves);
  const byStatus = leaves.reduce((m, l) => ({ ...m, [l.status]: (m[l.status] || 0) + 1 }), {});
  console.log(`✅ leaves: ${leaves.length} inserted ${JSON.stringify(byStatus)}`);

  // Sample sales from the day after the CSV ends up to today, so the
  // dashboard's "today" and "this month" views have data
  const recent = buildRecentSales(sales, products, leaves);
  await db.collection("sales").deleteMany({});
  await db.collection("sales").insertMany([...sales, ...recent]);
  const lastCsvDate = sales.map((s) => s.date).sort().pop();
  console.log(
    `✅ sales: ${sales.length} from CSV + ${recent.length} sample (after ${lastCsvDate} up to today)`,
  );

  const outlets = Object.fromEntries(
    readCsv("outlets_demo.csv").map((o) => [o.outlet_id, `${clean(o.outlet_name)}, ${clean(o.city)}`]),
  );
  const now = new Date();
  const users = readCsv("salespeople_demo.csv").map((p) => ({
    username: clean(p.salesperson_id).toLowerCase(), // e.g. emp-001
    password: "demo123",
    name: clean(p.salesperson_name),
    role: "salesman",
    salesmanId: clean(p.salesperson_id),
    notes: outlets[p.outlet_id] || "",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));
  users.push({
    username: "admin",
    password: "admin123",
    name: "Admin",
    role: "admin",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  await db.collection("users").deleteMany({});
  await db.collection("users").insertMany(users);
  console.log(`✅ users: ${users.length} inserted (12 salespeople + admin)`);
}

await mongoose.disconnect();

/**
 * Fictional sample sales for every day after the CSV's last date up to today.
 * Copies the CSV's patterns: same salespeople and outlets, ~5–9 sales a day,
 * mostly 1 unit, discounts of 0/5/10/15%. Skips anyone on leave that day.
 */
function buildRecentSales(csvSales, products, leaves) {
  let seed = 20261001;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const weighted = (pairs) => {
    let r = rand();
    for (const [value, w] of pairs) if ((r -= w) < 0) return value;
    return pairs[pairs.length - 1][0];
  };
  const iso = (d) => d.toISOString().slice(0, 10);

  // Each salesperson's outlet, taken from their CSV sales
  const people = {};
  csvSales.forEach((s) => (people[s.salesmanId] ??= { name: s.salesmanName, outlet: s.location }));
  const ids = Object.keys(people).sort();

  const onLeave = new Set(
    leaves.filter((l) => l.status !== "Rejected").map((l) => l.salesmanId + l.date),
  );
  const sellable = products.filter((p) => p.price > 0);

  const lastCsv = new Date(`${csvSales.map((s) => s.date).sort().pop()}T00:00:00Z`);
  const today = new Date(`${uaeToday()}T00:00:00Z`);

  const out = [];
  for (let d = new Date(lastCsv.getTime() + 86400000); d <= today; d = new Date(d.getTime() + 86400000)) {
    const date = iso(d);
    const isToday = date === iso(today);
    // Today: everyone working gets 2–4 sales, so the dashboard table is full.
    // Other days: 5–9 sales spread randomly, like the CSV.
    const sellers = isToday
      ? ids.flatMap((id) => Array(2 + Math.floor(rand() * 3)).fill(id))
      : Array.from({ length: 5 + Math.floor(rand() * 5) }, () => ids[Math.floor(rand() * ids.length)]);
    for (let i = 0; i < sellers.length; i++) {
      const id = sellers[i];
      if (onLeave.has(id + date)) continue;
      const p = sellable[Math.floor(rand() * sellable.length)];
      const quantity = weighted([[1, 0.7], [2, 0.2], [3, 0.07], [4, 0.03]]);
      const discount = weighted([[0, 0.55], [5, 0.25], [10, 0.15], [15, 0.05]]);
      const price = Math.round(p.price * (1 - discount / 100) * 100) / 100;
      out.push({
        salesmanId: id,
        salesmanName: people[id].name,
        date,
        location: people[id].outlet,
        brand: p.brand,
        itemCode: p.itemCode,
        barcode: p.ean,
        description: p.description,
        quantity,
        price,
        totalAmount: Math.round(price * quantity * 100) / 100,
        timestamp: new Date(`${date}T${String(10 + (i % 11)).padStart(2, "0")}:00:00Z`),
      });
    }
  }
  return out;
}

/**
 * Fictional leave records: 3–5 per salesperson between April and
 * three weeks from today, on days they made no sales.
 * Past leaves are Approved/Rejected; upcoming ones are mostly Pending.
 * A seeded random generator keeps the output the same on every run.
 */
function buildDemoLeaves(sales) {
  let seed = 20260401;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const iso = (d) => d.toISOString().slice(0, 10);
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

  const reasons = [
    "Medical appointment",
    "Fever, not feeling well",
    "Family function",
    "Child's school event",
    "Personal work",
    "Visa / document renewal",
    "Travelling home for family visit",
    "Dental appointment",
    "Car service and registration",
    "Moving to a new flat",
  ];
  const approveNotes = ["Approved", "Approved, get well soon", "OK, enjoy", "Approved, cover arranged"];
  const rejectNotes = [
    "Weekend promotion, need full staff",
    "Two colleagues already off that day",
    "Stock count day, please choose another date",
  ];

  const today = new Date(`${uaeToday()}T00:00:00Z`);
  const start = new Date("2026-04-01T00:00:00Z");
  const end = addDays(today, 21);
  const span = Math.round((end - start) / 86400000);

  const people = {};
  sales.forEach((s) => {
    people[s.salesmanId] ??= { name: s.salesmanName, busy: new Set() };
    people[s.salesmanId].busy.add(s.date);
  });

  const leaves = [];
  Object.entries(people)
    .sort()
    .forEach(([id, p], idx) => {
      const used = new Set();
      const count = 3 + Math.floor(rand() * 3);
      // Give a few people a leave today and an upcoming pending request,
      // so "on leave today" and the approve/reject buttons have data
      const forced = idx % 4 === 0 ? [iso(today)] : idx % 3 === 1 ? [iso(addDays(today, 3 + idx))] : [];

      const dates = [...forced];
      for (let tries = 0; dates.length < count && tries < 200; tries++) {
        const d = iso(addDays(start, Math.floor(rand() * span)));
        if (!p.busy.has(d) && !dates.includes(d)) dates.push(d);
      }

      dates.forEach((date) => {
        if (used.has(date)) return;
        used.add(date);
        const day = new Date(`${date}T00:00:00Z`);
        const isFuture = day > today;
        const appliedRaw = addDays(day, -(2 + Math.floor(rand() * 10)));
        const appliedAt = appliedRaw > today ? today : appliedRaw;
        const actedAt = addDays(appliedAt, 1) > today ? today : addDays(appliedAt, 1);
        let status;
        if (date === iso(today)) status = "Approved";
        else if (isFuture) status = rand() < 0.75 ? "Pending" : "Approved";
        else status = rand() < 0.85 ? "Approved" : "Rejected";

        leaves.push({
          salesmanId: id,
          salesmanName: p.name,
          date,
          reason: pick(reasons),
          status,
          adminRemark:
            status === "Approved" ? pick(approveNotes) : status === "Rejected" ? pick(rejectNotes) : "",
          appliedAt,
          actionAt: status === "Pending" ? null : actedAt,
          timestamp: appliedAt,
        });
      });
    });
  return leaves.sort((a, b) => a.date.localeCompare(b.date));
}

// Today's date in the UAE (the business time zone), as YYYY-MM-DD
function uaeToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date());
}
