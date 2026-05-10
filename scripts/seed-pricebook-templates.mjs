#!/usr/bin/env node
/**
 * Seed pricebook_templates with 12 trades and 170+ items.
 * Run: node scripts/seed-pricebook-templates.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(url, key);

const TEMPLATES = [
  // ─── PLUMBING ───────────────────────────────────────────────────────────
  { trade: "plumbing", name: "Service call — standard", description: "First hour on-site labour", unit_price: 165, unit: "hr", category: "Labour", is_service: true },
  { trade: "plumbing", name: "Labour — additional hour", description: "After first hour, per hour", unit_price: 130, unit: "hr", category: "Labour", is_service: true },
  { trade: "plumbing", name: "Emergency callout (after hours)", description: "After-hours / public holiday surcharge", unit_price: 280, unit: "each", category: "Labour", is_service: true },
  { trade: "plumbing", name: "Replace tap washer", description: null, unit_price: 95, unit: "each", category: "Repairs", is_service: true },
  { trade: "plumbing", name: "Replace mixer tap", description: "Supply & install standard mixer", unit_price: 320, unit: "each", category: "Fixtures", is_service: true },
  { trade: "plumbing", name: "Install toilet suite", description: "Supply & install close-coupled toilet", unit_price: 680, unit: "each", category: "Fixtures", is_service: true },
  { trade: "plumbing", name: "Hot water unit — gas storage 135L", description: "Supply & install Rheem or equivalent", unit_price: 1650, unit: "each", category: "Hot Water", is_service: false },
  { trade: "plumbing", name: "Hot water unit — electric 250L", description: "Supply & install", unit_price: 1450, unit: "each", category: "Hot Water", is_service: false },
  { trade: "plumbing", name: "Copper pipe 15mm", description: null, unit_price: 8.50, unit: "m", category: "Materials", is_service: false },
  { trade: "plumbing", name: "Copper pipe 22mm", description: null, unit_price: 12.00, unit: "m", category: "Materials", is_service: false },
  { trade: "plumbing", name: "PVC pipe 100mm", description: null, unit_price: 14.00, unit: "m", category: "Materials", is_service: false },
  { trade: "plumbing", name: "Drain clean — standard", description: "Electric eel drain cleaning", unit_price: 240, unit: "each", category: "Drains", is_service: true },
  { trade: "plumbing", name: "CCTV drain inspection", description: "Camera inspection with report", unit_price: 380, unit: "each", category: "Drains", is_service: true },
  { trade: "plumbing", name: "Gas leak test", description: "Pressure test and report", unit_price: 220, unit: "each", category: "Gas", is_service: true },
  { trade: "plumbing", name: "Gas bayonet point", description: "Supply & install gas bayonet", unit_price: 185, unit: "each", category: "Gas", is_service: true },

  // ─── ELECTRICAL ─────────────────────────────────────────────────────────
  { trade: "electrical", name: "Service call — standard", description: "First hour on-site labour", unit_price: 175, unit: "hr", category: "Labour", is_service: true },
  { trade: "electrical", name: "Labour — additional hour", description: null, unit_price: 140, unit: "hr", category: "Labour", is_service: true },
  { trade: "electrical", name: "Emergency callout", description: "After-hours response", unit_price: 295, unit: "each", category: "Labour", is_service: true },
  { trade: "electrical", name: "Power point — single GPO", description: "Supply & install standard GPO", unit_price: 145, unit: "each", category: "Power", is_service: true },
  { trade: "electrical", name: "Power point — double GPO", description: "Supply & install double GPO", unit_price: 165, unit: "each", category: "Power", is_service: true },
  { trade: "electrical", name: "Safety switch (RCD) installation", description: "Install RCD on switchboard", unit_price: 280, unit: "each", category: "Safety", is_service: true },
  { trade: "electrical", name: "Smoke alarm — installation", description: "Supply & install 240V hardwired smoke alarm", unit_price: 195, unit: "each", category: "Safety", is_service: true },
  { trade: "electrical", name: "Ceiling fan installation", description: "Install supplied ceiling fan", unit_price: 220, unit: "each", category: "Lighting", is_service: true },
  { trade: "electrical", name: "LED downlight installation", description: "Supply & install LED downlight", unit_price: 95, unit: "each", category: "Lighting", is_service: true },
  { trade: "electrical", name: "Switchboard upgrade — 3 phase", description: "Main switchboard upgrade to 3-phase", unit_price: 3200, unit: "each", category: "Switchboards", is_service: true },
  { trade: "electrical", name: "EV charger installation", description: "7kW home EV charger supply & install", unit_price: 1800, unit: "each", category: "EV", is_service: true },
  { trade: "electrical", name: "Solar — 6.6kW system", description: "22 x 300W panels, 5kW inverter, install", unit_price: 6500, unit: "each", category: "Solar", is_service: true },
  { trade: "electrical", name: "Cable — TPS 2.5mm twin & earth", description: null, unit_price: 2.80, unit: "m", category: "Materials", is_service: false },
  { trade: "electrical", name: "Conduit — 20mm PVC", description: null, unit_price: 1.50, unit: "m", category: "Materials", is_service: false },

  // ─── CLEANING ────────────────────────────────────────────────────────────
  { trade: "cleaning", name: "Regular clean — 2 bed / 1 bath", description: "2h standard clean", unit_price: 160, unit: "each", category: "Residential", is_service: true },
  { trade: "cleaning", name: "Regular clean — 3 bed / 2 bath", description: "2.5h standard clean", unit_price: 200, unit: "each", category: "Residential", is_service: true },
  { trade: "cleaning", name: "Regular clean — 4 bed / 2 bath", description: "3h standard clean", unit_price: 240, unit: "each", category: "Residential", is_service: true },
  { trade: "cleaning", name: "End of lease clean", description: "Full bond clean, all areas", unit_price: 450, unit: "each", category: "Bond", is_service: true },
  { trade: "cleaning", name: "Oven clean", description: "Deep clean oven inside & out", unit_price: 90, unit: "each", category: "Deep Clean", is_service: true },
  { trade: "cleaning", name: "Window cleaning — internal", description: "Per window, interior", unit_price: 8, unit: "each", category: "Windows", is_service: true },
  { trade: "cleaning", name: "Window cleaning — external", description: "Per window, exterior", unit_price: 10, unit: "each", category: "Windows", is_service: true },
  { trade: "cleaning", name: "Carpet steam clean — per room", description: "Per room up to 20m²", unit_price: 75, unit: "each", category: "Carpet", is_service: true },
  { trade: "cleaning", name: "Office clean — per hour", description: "Commercial office cleaning", unit_price: 55, unit: "hr", category: "Commercial", is_service: true },
  { trade: "cleaning", name: "Pressure wash — driveway", description: "Per 30m² driveway", unit_price: 180, unit: "each", category: "External", is_service: true },
  { trade: "cleaning", name: "Cleaning supplies — consumables", description: "Chemicals and materials per visit", unit_price: 15, unit: "each", category: "Consumables", is_service: false },

  // ─── LANDSCAPING ─────────────────────────────────────────────────────────
  { trade: "landscaping", name: "Labour — landscape", description: "Per hour landscape labour", unit_price: 75, unit: "hr", category: "Labour", is_service: true },
  { trade: "landscaping", name: "Lawn mowing — small (<200m²)", description: "Mow, edge, blow", unit_price: 65, unit: "each", category: "Lawns", is_service: true },
  { trade: "landscaping", name: "Lawn mowing — medium (200-500m²)", description: null, unit_price: 110, unit: "each", category: "Lawns", is_service: true },
  { trade: "landscaping", name: "Lawn mowing — large (>500m²)", description: null, unit_price: 165, unit: "each", category: "Lawns", is_service: true },
  { trade: "landscaping", name: "Garden maintenance — hourly", description: "Weeding, pruning, tidy", unit_price: 70, unit: "hr", category: "Gardens", is_service: true },
  { trade: "landscaping", name: "Hedge trimming", description: "Per linear metre", unit_price: 18, unit: "m", category: "Pruning", is_service: true },
  { trade: "landscaping", name: "Turf supply & lay — Sir Walter", description: "Per m², supply & lay", unit_price: 28, unit: "m²", category: "Turf", is_service: false },
  { trade: "landscaping", name: "Mulch — wood chip", description: "Per cubic metre, supply & lay", unit_price: 120, unit: "m³", category: "Materials", is_service: false },
  { trade: "landscaping", name: "Topsoil supply & spread", description: "Per cubic metre", unit_price: 95, unit: "m³", category: "Materials", is_service: false },
  { trade: "landscaping", name: "Retaining wall — timber sleeper", description: "Per lineal metre, supply & install", unit_price: 180, unit: "m", category: "Structures", is_service: true },
  { trade: "landscaping", name: "Irrigation system — zone", description: "Install per zone", unit_price: 380, unit: "each", category: "Irrigation", is_service: true },
  { trade: "landscaping", name: "Tree removal — small (<5m)", description: null, unit_price: 450, unit: "each", category: "Trees", is_service: true },
  { trade: "landscaping", name: "Tree removal — large (>5m)", description: "Stump grind extra", unit_price: 1200, unit: "each", category: "Trees", is_service: true },
  { trade: "landscaping", name: "Stump grinding", description: "Per stump", unit_price: 180, unit: "each", category: "Trees", is_service: true },

  // ─── HVAC ────────────────────────────────────────────────────────────────
  { trade: "hvac", name: "Service call — HVAC", description: "First hour on-site", unit_price: 185, unit: "hr", category: "Labour", is_service: true },
  { trade: "hvac", name: "Labour — additional hour", description: null, unit_price: 145, unit: "hr", category: "Labour", is_service: true },
  { trade: "hvac", name: "Split system install — 2.5kW", description: "Supply & install, indoor + outdoor", unit_price: 1650, unit: "each", category: "Installation", is_service: true },
  { trade: "hvac", name: "Split system install — 5kW", description: "Supply & install, indoor + outdoor", unit_price: 2200, unit: "each", category: "Installation", is_service: true },
  { trade: "hvac", name: "Split system install — 7kW", description: "Supply & install, indoor + outdoor", unit_price: 2750, unit: "each", category: "Installation", is_service: true },
  { trade: "hvac", name: "AC service & clean — single split", description: "Annual service, coil clean, gas check", unit_price: 220, unit: "each", category: "Servicing", is_service: true },
  { trade: "hvac", name: "AC service — ducted system", description: "Full ducted system service", unit_price: 480, unit: "each", category: "Servicing", is_service: true },
  { trade: "hvac", name: "Gas top-up — R410A", description: "Refrigerant gas top-up per kg", unit_price: 90, unit: "kg", category: "Materials", is_service: false },
  { trade: "hvac", name: "Ductwork — flexible per metre", description: null, unit_price: 25, unit: "m", category: "Materials", is_service: false },
  { trade: "hvac", name: "Evaporative service", description: "Annual evaporative cooler service", unit_price: 280, unit: "each", category: "Servicing", is_service: true },

  // ─── PEST CONTROL ────────────────────────────────────────────────────────
  { trade: "pest_control", name: "General pest spray — 3 bed house", description: "Internal & external spray", unit_price: 220, unit: "each", category: "General", is_service: true },
  { trade: "pest_control", name: "General pest spray — 4 bed house", description: null, unit_price: 270, unit: "each", category: "General", is_service: true },
  { trade: "pest_control", name: "Termite inspection — visual", description: "Visual inspection, written report", unit_price: 280, unit: "each", category: "Termites", is_service: true },
  { trade: "pest_control", name: "Termite inspection — thermal/moisture", description: "Thermal & moisture meter inspection", unit_price: 450, unit: "each", category: "Termites", is_service: true },
  { trade: "pest_control", name: "Termite treatment — chemical barrier", description: "Chemical soil barrier per lineal metre", unit_price: 65, unit: "m", category: "Termites", is_service: true },
  { trade: "pest_control", name: "Termite bait station", description: "Supply & install per station", unit_price: 95, unit: "each", category: "Termites", is_service: false },
  { trade: "pest_control", name: "Rodent control program", description: "Bait stations, first service", unit_price: 280, unit: "each", category: "Rodents", is_service: true },
  { trade: "pest_control", name: "Cockroach treatment", description: "Gel bait + spray, single dwelling", unit_price: 180, unit: "each", category: "Insects", is_service: true },
  { trade: "pest_control", name: "Ant treatment", description: "External perimeter treatment", unit_price: 160, unit: "each", category: "Insects", is_service: true },
  { trade: "pest_control", name: "Spider treatment", description: null, unit_price: 150, unit: "each", category: "Insects", is_service: true },

  // ─── HANDYMAN ────────────────────────────────────────────────────────────
  { trade: "handyman", name: "Labour — handyman", description: "Per hour, general handyman", unit_price: 85, unit: "hr", category: "Labour", is_service: true },
  { trade: "handyman", name: "Flat-pack furniture assembly — small", description: "e.g. bedside table, bookshelf", unit_price: 120, unit: "each", category: "Assembly", is_service: true },
  { trade: "handyman", name: "Flat-pack furniture assembly — large", description: "e.g. wardrobe, bed frame", unit_price: 220, unit: "each", category: "Assembly", is_service: true },
  { trade: "handyman", name: "Picture hanging — per item", description: "Supply anchors, hang level", unit_price: 35, unit: "each", category: "Hanging", is_service: true },
  { trade: "handyman", name: "TV wall mounting — standard", description: "Mount supplied TV, up to 65\"", unit_price: 180, unit: "each", category: "Hanging", is_service: true },
  { trade: "handyman", name: "Door adjustment / repair", description: "Adjust sticking or binding door", unit_price: 115, unit: "each", category: "Doors", is_service: true },
  { trade: "handyman", name: "Install door handle / lock set", description: "Supply & install standard lock set", unit_price: 145, unit: "each", category: "Doors", is_service: true },
  { trade: "handyman", name: "Caulking / silicone — bathroom", description: "Remove and regrout/silicone one room", unit_price: 180, unit: "each", category: "Bathroom", is_service: true },
  { trade: "handyman", name: "Patch plaster — small hole", description: "Fill, sand, prime", unit_price: 95, unit: "each", category: "Plastering", is_service: true },
  { trade: "handyman", name: "Clothesline installation", description: "Install Hills Hoist or retractable", unit_price: 165, unit: "each", category: "Outdoor", is_service: true },
  { trade: "handyman", name: "Letterbox installation", description: null, unit_price: 95, unit: "each", category: "Outdoor", is_service: true },

  // ─── BUILDING / CARPENTRY ─────────────────────────────────────────────
  { trade: "building", name: "Labour — carpenter", description: "Per hour carpentry labour", unit_price: 95, unit: "hr", category: "Labour", is_service: true },
  { trade: "building", name: "Labour — labourer", description: "General labour per hour", unit_price: 65, unit: "hr", category: "Labour", is_service: true },
  { trade: "building", name: "Deck construction — hardwood", description: "Per m², supply & build", unit_price: 380, unit: "m²", category: "Decking", is_service: true },
  { trade: "building", name: "Deck construction — composite", description: "Per m², supply & build", unit_price: 460, unit: "m²", category: "Decking", is_service: true },
  { trade: "building", name: "Pergola — standard kit", description: "Supply & install standard kit", unit_price: 3800, unit: "each", category: "Pergolas", is_service: true },
  { trade: "building", name: "Fence — paling per lineal metre", description: "Supply & install 1.8m paling fence", unit_price: 95, unit: "m", category: "Fencing", is_service: true },
  { trade: "building", name: "Fence — Colorbond per lineal metre", description: "Supply & install Colorbond 1.8m", unit_price: 130, unit: "m", category: "Fencing", is_service: true },
  { trade: "building", name: "Shed — small metal kit", description: "Supply & install 3x3m shed", unit_price: 2200, unit: "each", category: "Sheds", is_service: true },
  { trade: "building", name: "Frame & truss — per m²", description: "Structural framing per floor area", unit_price: 85, unit: "m²", category: "Framing", is_service: true },
  { trade: "building", name: "Cladding — FC sheet", description: "Supply & fix per m²", unit_price: 55, unit: "m²", category: "Cladding", is_service: false },
  { trade: "building", name: "Plasterboard — 10mm", description: "Supply & fix per m²", unit_price: 28, unit: "m²", category: "Materials", is_service: false },
  { trade: "building", name: "Timber — 90x45 H2 treated", description: "Per lineal metre", unit_price: 7.50, unit: "m", category: "Materials", is_service: false },

  // ─── PAINTING ────────────────────────────────────────────────────────────
  { trade: "painting", name: "Labour — painter", description: "Per hour painting labour", unit_price: 75, unit: "hr", category: "Labour", is_service: true },
  { trade: "painting", name: "Interior walls — per m²", description: "2 coats quality acrylic", unit_price: 22, unit: "m²", category: "Interior", is_service: true },
  { trade: "painting", name: "Interior ceiling — per m²", description: "2 coats ceiling white", unit_price: 18, unit: "m²", category: "Interior", is_service: true },
  { trade: "painting", name: "Interior room — 3 bed/2 bath quote", description: "Full interior painting quote base", unit_price: 3800, unit: "each", category: "Interior", is_service: true },
  { trade: "painting", name: "Exterior walls — per m²", description: "Prep, prime, 2 coats", unit_price: 28, unit: "m²", category: "Exterior", is_service: true },
  { trade: "painting", name: "Exterior — full house quote", description: "Full exterior painting quote base", unit_price: 5500, unit: "each", category: "Exterior", is_service: true },
  { trade: "painting", name: "Doors — per door (both sides)", description: "Sand, prepare, 2 coats", unit_price: 180, unit: "each", category: "Doors", is_service: true },
  { trade: "painting", name: "Trim / skirting — per lineal metre", description: null, unit_price: 12, unit: "m", category: "Trim", is_service: true },
  { trade: "painting", name: "Paint — Dulux Wash & Wear 15L", description: null, unit_price: 145, unit: "each", category: "Materials", is_service: false },
  { trade: "painting", name: "Paint — Dulux Weathershield 15L", description: null, unit_price: 175, unit: "each", category: "Materials", is_service: false },
  { trade: "painting", name: "Prep — sanding, filling, priming", description: "Per hour, prep labour", unit_price: 70, unit: "hr", category: "Prep", is_service: true },

  // ─── TILING ──────────────────────────────────────────────────────────────
  { trade: "tiling", name: "Labour — tiler", description: "Per hour tiling labour", unit_price: 90, unit: "hr", category: "Labour", is_service: true },
  { trade: "tiling", name: "Floor tiles — standard", description: "Supply & lay per m², adhesive inc.", unit_price: 85, unit: "m²", category: "Floor", is_service: true },
  { trade: "tiling", name: "Floor tiles — large format (600mm+)", description: "Per m²", unit_price: 120, unit: "m²", category: "Floor", is_service: true },
  { trade: "tiling", name: "Wall tiles — standard", description: "Supply & lay per m²", unit_price: 95, unit: "m²", category: "Wall", is_service: true },
  { trade: "tiling", name: "Tile removal — per m²", description: "Chip out existing tiles", unit_price: 30, unit: "m²", category: "Removal", is_service: true },
  { trade: "tiling", name: "Waterproofing — wet area", description: "Per m², 2 coat membrane", unit_price: 45, unit: "m²", category: "Waterproofing", is_service: true },
  { trade: "tiling", name: "Grout — standard", description: "Per kg", unit_price: 8, unit: "kg", category: "Materials", is_service: false },
  { trade: "tiling", name: "Adhesive — flexible", description: "Per 20kg bag", unit_price: 35, unit: "each", category: "Materials", is_service: false },
  { trade: "tiling", name: "Shower niche installation", description: "Pre-formed niche supply & install", unit_price: 280, unit: "each", category: "Features", is_service: true },
  { trade: "tiling", name: "Full bathroom tiling — standard", description: "Floor + walls, inc. waterproofing", unit_price: 2800, unit: "each", category: "Packages", is_service: true },

  // ─── CONCRETING ──────────────────────────────────────────────────────────
  { trade: "concreting", name: "Labour — concreter", description: "Per hour concreting labour", unit_price: 85, unit: "hr", category: "Labour", is_service: true },
  { trade: "concreting", name: "Concrete driveway — standard", description: "100mm slab, broom finish, per m²", unit_price: 120, unit: "m²", category: "Driveways", is_service: true },
  { trade: "concreting", name: "Concrete driveway — exposed agg.", description: "100mm exposed aggregate per m²", unit_price: 165, unit: "m²", category: "Driveways", is_service: true },
  { trade: "concreting", name: "Concrete path — per m²", description: "75mm path, broom finish", unit_price: 95, unit: "m²", category: "Paths", is_service: true },
  { trade: "concreting", name: "Concrete slab — shed/garage", description: "100mm slab per m²", unit_price: 110, unit: "m²", category: "Slabs", is_service: true },
  { trade: "concreting", name: "Remove existing concrete — per m²", description: "Break up and remove", unit_price: 45, unit: "m²", category: "Removal", is_service: true },
  { trade: "concreting", name: "Concrete — 20MPa per m³", description: "Ready-mix supply", unit_price: 250, unit: "m³", category: "Materials", is_service: false },
  { trade: "concreting", name: "Reo mesh — SL62", description: "Per sheet (6m x 2.4m)", unit_price: 95, unit: "each", category: "Materials", is_service: false },
  { trade: "concreting", name: "Boxover culvert — 300mm", description: "Supply & install per lineal metre", unit_price: 110, unit: "m", category: "Drainage", is_service: true },
  { trade: "concreting", name: "Formwork & strip — per lineal metre", description: null, unit_price: 18, unit: "m", category: "Labour", is_service: true },

  // ─── ROOFING ─────────────────────────────────────────────────────────────
  { trade: "roofing", name: "Labour — roofer", description: "Per hour roofing labour", unit_price: 90, unit: "hr", category: "Labour", is_service: true },
  { trade: "roofing", name: "Re-bedding & repointing — per lineal metre", description: "Ridge capping re-bed & repoint", unit_price: 35, unit: "m", category: "Repairs", is_service: true },
  { trade: "roofing", name: "Tile replacement — terracotta", description: "Supply & fix per tile", unit_price: 55, unit: "each", category: "Repairs", is_service: true },
  { trade: "roofing", name: "Tile replacement — concrete", description: "Supply & fix per tile", unit_price: 45, unit: "each", category: "Repairs", is_service: true },
  { trade: "roofing", name: "Colorbond roof — per m²", description: "Supply & install Colorbond sheeting", unit_price: 95, unit: "m²", category: "Colorbond", is_service: true },
  { trade: "roofing", name: "Gutter replacement — Colorbond", description: "Per lineal metre supply & fit", unit_price: 55, unit: "m", category: "Gutters", is_service: true },
  { trade: "roofing", name: "Downpipe replacement", description: "Per lineal metre", unit_price: 45, unit: "m", category: "Gutters", is_service: true },
  { trade: "roofing", name: "Roof cleaning — pressure wash", description: "Per m² roof area", unit_price: 8, unit: "m²", category: "Cleaning", is_service: true },
  { trade: "roofing", name: "Sarking — foil insulation", description: "Supply & install per m²", unit_price: 12, unit: "m²", category: "Materials", is_service: false },
  { trade: "roofing", name: "Skylight installation — fixed", description: "Supply & install 450x600 fixed skylight", unit_price: 1200, unit: "each", category: "Skylights", is_service: true },
  { trade: "roofing", name: "Safety harness — anchor point", description: "Install compliant anchor point", unit_price: 350, unit: "each", category: "Safety", is_service: true },
  { trade: "roofing", name: "Gutter guard — per lineal metre", description: "Supply & fit mesh gutter guard", unit_price: 28, unit: "m", category: "Gutters", is_service: false },
];

async function main() {
  console.log(`Seeding ${TEMPLATES.length} pricebook templates…`);

  // Clear existing templates
  const { error: delErr } = await supabase.from("pricebook_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) { console.error("Delete failed:", delErr.message); process.exit(1); }

  // Insert in batches of 50
  for (let i = 0; i < TEMPLATES.length; i += 50) {
    const batch = TEMPLATES.slice(i, i + 50);
    const { error } = await supabase.from("pricebook_templates").insert(batch);
    if (error) { console.error(`Insert failed at offset ${i}:`, error.message); process.exit(1); }
    console.log(`  Inserted rows ${i + 1}–${Math.min(i + 50, TEMPLATES.length)}`);
  }

  console.log(`Done — ${TEMPLATES.length} templates seeded.`);

  // Summary by trade
  const trades = [...new Set(TEMPLATES.map(t => t.trade))];
  for (const trade of trades) {
    const count = TEMPLATES.filter(t => t.trade === trade).length;
    console.log(`  ${trade}: ${count} items`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
