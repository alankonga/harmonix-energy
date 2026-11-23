/* ==========================================================
   Harmonix Energy Solutions: site data (projects, equipment, packages)

   Edit this through admin.html, which builds the whole file for you,
   or by hand. Prices are in KES; use null when a price is not set yet
   and the site will show "Price on request".

   The equipment below matches the homepage mockup. Change names, prices and
   photos with admin.html. "image" is optional (e.g. images/prod-deye.png).

   Equipment categories and the unit of "rating":
     panel      watts (W)         inverter    kilowatts (kW)
     battery    kilowatt-hours    controller  amps (A)
   ========================================================== */
const SITE_DATA = {
  "projects": [],
  "products": [
    {
      "id": "deye-5kw-hybrid-inverter",
      "category": "inverter",
      "name": "Deye 5kW Hybrid Inverter",
      "brand": "",
      "rating": 5,
      "details": "Dual MPPT, 48V Battery Ready, Wi-Fi Monitoring",
      "price": 185000,
      "image": "images/prod-deye.png"
    },
    {
      "id": "huawei-10kwh-battery",
      "category": "battery",
      "name": "Huawei 10kWh Lithium Battery",
      "brand": "",
      "rating": 10,
      "details": "LiFePO4, Long Life Cycle, Smart BMS",
      "price": 320000,
      "image": "images/prod-huawei.png"
    },
    {
      "id": "victron-100-30-controller",
      "category": "controller",
      "name": "Victron 100/30 Charge Controller",
      "brand": "",
      "rating": 30,
      "details": "MPPT Technology, High Efficiency, Bluetooth Ready",
      "price": 28000,
      "image": "images/prod-victron.png"
    },
    {
      "id": "jinko-550w-panel",
      "category": "panel",
      "name": "Jinko 550W Solar Panel",
      "brand": "",
      "rating": 550,
      "details": "High Efficiency, 25-Year Warranty, Tier 1 Brand",
      "price": 24500,
      "image": "images/prod-jinko.png"
    },
    {
      "id": "dc-protection-mcb-spd",
      "category": "protection",
      "name": "DC Protection (MCB + SPD)",
      "brand": "",
      "rating": null,
      "details": "Safety First, Surge Protection, Reliable",
      "price": 12500,
      "image": "images/prod-dc.png"
    },
    {
      "id": "solar-cables-mc4",
      "category": "accessory",
      "name": "Solar Cables & MC4 Connectors",
      "brand": "",
      "rating": null,
      "details": "UV Resistant, Premium Quality, Various Sizes",
      "price": 5000,
      "image": "images/prod-cables.png"
    }
  ],
  "packages": [
    {
      "id": "package-home-sample",
      "name": "Home package (sample)",
      "description": "Sample package. Edit or replace it in admin.html.",
      "panelId": "jinko-550w-panel",
      "panelQty": 8,
      "inverterId": "deye-5kw-hybrid-inverter",
      "inverterQty": 1,
      "batteryId": "huawei-10kwh-battery",
      "batteryQty": 1,
      "controllerId": "",
      "controllerQty": 0,
      "price": null
    }
  ]
};
