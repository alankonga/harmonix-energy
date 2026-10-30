/* ==========================================================
   Harmonix Energy Solutions: site data (projects, equipment, packages)

   Edit this through admin.html, which builds the whole file for you,
   or by hand. Prices are in KES; use null when a price is not set yet
   and the site will show "Price on request".

   The equipment and packages below are SAMPLES with no prices.
   Replace them with your real products using admin.html.

   Equipment categories and the unit of "rating":
     panel      watts (W)         inverter    kilowatts (kW)
     battery    kilowatt-hours    controller  amps (A)
   ========================================================== */
const SITE_DATA = {
  "projects": [],
  "products": [
    {
      "id": "panel-615-sample",
      "category": "panel",
      "name": "Mono solar panel 615 W",
      "brand": "",
      "rating": 615,
      "details": "Sample product",
      "price": null
    },
    {
      "id": "panel-725-sample",
      "category": "panel",
      "name": "Mono solar panel 725 W",
      "brand": "",
      "rating": 725,
      "details": "Sample product",
      "price": null
    },
    {
      "id": "inverter-5kw-sample",
      "category": "inverter",
      "name": "Hybrid inverter 5 kW",
      "brand": "",
      "rating": 5,
      "details": "Sample product",
      "price": null
    },
    {
      "id": "battery-5kwh-sample",
      "category": "battery",
      "name": "Lithium battery 5 kWh (48 V)",
      "brand": "",
      "rating": 5,
      "details": "Sample product",
      "price": null
    },
    {
      "id": "controller-60a-sample",
      "category": "controller",
      "name": "MPPT charge controller 60 A",
      "brand": "",
      "rating": 60,
      "details": "Sample product",
      "price": null
    }
  ],
  "packages": [
    {
      "id": "package-home-sample",
      "name": "Home package (sample)",
      "description": "Sample package. Edit or replace it in admin.html.",
      "panelId": "panel-615-sample",
      "panelQty": 8,
      "inverterId": "inverter-5kw-sample",
      "inverterQty": 1,
      "batteryId": "battery-5kwh-sample",
      "batteryQty": 2,
      "controllerId": "",
      "controllerQty": 0,
      "price": null
    }
  ]
};
