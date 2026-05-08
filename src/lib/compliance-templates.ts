/**
 * 10 starter compliance form templates for Australian service businesses.
 * Fields use type: "checkbox" | "text" | "textarea" | "signature" | "photo" | "select"
 */

export type FormField = {
  id: string;
  type: "checkbox" | "text" | "textarea" | "signature" | "photo" | "select";
  label: string;
  required: boolean;
  options?: string[]; // for select type
};

export type ComplianceTemplate = {
  title: string;
  description: string;
  fields: FormField[];
};

export const COMPLIANCE_TEMPLATES: ComplianceTemplate[] = [
  {
    title: "Job Site Safety Checklist",
    description: "Pre-work safety inspection for any job site.",
    fields: [
      { id: "ppe_worn", type: "checkbox", label: "PPE is worn by all workers on site", required: true },
      { id: "hazards_identified", type: "checkbox", label: "Site hazards have been identified and assessed", required: true },
      { id: "emergency_plan", type: "checkbox", label: "Emergency plan and first aid kit are accessible", required: true },
      { id: "tools_inspected", type: "checkbox", label: "Tools and equipment have been inspected before use", required: true },
      { id: "site_secured", type: "checkbox", label: "Work area is secured and barricaded where needed", required: true },
      { id: "hazard_notes", type: "textarea", label: "Notes on identified hazards or special conditions", required: false },
      { id: "inspector_name", type: "text", label: "Inspector name", required: true },
      { id: "signature", type: "signature", label: "Inspector signature", required: true },
    ],
  },
  {
    title: "Electrical Safety Inspection",
    description: "Pre-work electrical safety check for licensed electricians.",
    fields: [
      { id: "power_isolated", type: "checkbox", label: "Power has been isolated and LOTO applied", required: true },
      { id: "rcd_tested", type: "checkbox", label: "RCD tested and functional", required: true },
      { id: "insulation_checked", type: "checkbox", label: "Insulation resistance checked", required: true },
      { id: "earthing_verified", type: "checkbox", label: "Earthing and bonding verified", required: true },
      { id: "circuit_labelled", type: "checkbox", label: "All circuits correctly labelled", required: true },
      { id: "compliance_plate", type: "checkbox", label: "Compliance plate installed where required", required: false },
      { id: "notes", type: "textarea", label: "Additional notes", required: false },
      { id: "licence_number", type: "text", label: "Electrician licence number", required: true },
      { id: "signature", type: "signature", label: "Electrician signature", required: true },
    ],
  },
  {
    title: "Plumbing Compliance Sign-off",
    description: "Post-work plumbing compliance checklist.",
    fields: [
      { id: "water_tested", type: "checkbox", label: "Water pressure tested and within tolerance", required: true },
      { id: "no_leaks", type: "checkbox", label: "All connections checked — no leaks detected", required: true },
      { id: "hot_water_temp", type: "checkbox", label: "Hot water temperature set to 60°C or per AS/NZS 3500", required: true },
      { id: "drainage_tested", type: "checkbox", label: "Drainage tested and flows freely", required: true },
      { id: "backflow_prevention", type: "checkbox", label: "Backflow prevention devices installed/checked", required: false },
      { id: "photos", type: "photo", label: "Photo of completed work", required: false },
      { id: "licence_number", type: "text", label: "Plumber licence number", required: true },
      { id: "signature", type: "signature", label: "Plumber signature", required: true },
    ],
  },
  {
    title: "Cleaning Handover Checklist",
    description: "End-of-job cleaning quality sign-off.",
    fields: [
      { id: "kitchen_cleaned", type: "checkbox", label: "Kitchen cleaned including appliances", required: true },
      { id: "bathrooms_cleaned", type: "checkbox", label: "Bathrooms and toilets cleaned and sanitised", required: true },
      { id: "floors_cleaned", type: "checkbox", label: "All floors vacuumed/mopped", required: true },
      { id: "windows_cleaned", type: "checkbox", label: "Windows and glass surfaces cleaned", required: false },
      { id: "rubbish_removed", type: "checkbox", label: "Rubbish removed and bins emptied", required: true },
      { id: "products_used", type: "text", label: "Cleaning products used", required: false },
      { id: "areas_missed", type: "textarea", label: "Areas requiring follow-up or noted exceptions", required: false },
      { id: "cleaner_name", type: "text", label: "Cleaner name", required: true },
    ],
  },
  {
    title: "HVAC Maintenance Report",
    description: "Air conditioning and HVAC service checklist.",
    fields: [
      { id: "filters_cleaned", type: "checkbox", label: "Filters cleaned or replaced", required: true },
      { id: "coils_inspected", type: "checkbox", label: "Evaporator and condenser coils inspected", required: true },
      { id: "refrigerant_checked", type: "checkbox", label: "Refrigerant level checked", required: true },
      { id: "drainage_clear", type: "checkbox", label: "Condensate drain clear and flowing", required: true },
      { id: "thermostat_calibrated", type: "checkbox", label: "Thermostat calibrated and tested", required: true },
      { id: "belts_bearings", type: "checkbox", label: "Belts and bearings inspected", required: false },
      { id: "temperature_reading", type: "text", label: "Supply air temperature (°C)", required: false },
      { id: "next_service_due", type: "text", label: "Next service due date", required: false },
      { id: "technician_name", type: "text", label: "Technician name", required: true },
    ],
  },
  {
    title: "Roof Inspection Report",
    description: "Residential or commercial roof inspection checklist.",
    fields: [
      { id: "gutters_clear", type: "checkbox", label: "Gutters and downpipes clear and flowing", required: true },
      { id: "tiles_intact", type: "checkbox", label: "Roof tiles/sheeting intact — no cracking or movement", required: true },
      { id: "flashing_checked", type: "checkbox", label: "Flashings sealed and no visible gaps", required: true },
      { id: "skylights_checked", type: "checkbox", label: "Skylights and penetrations checked for leaks", required: false },
      { id: "ridge_capping", type: "checkbox", label: "Ridge capping secure and mortared", required: false },
      { id: "damage_found", type: "textarea", label: "Description of damage or items requiring repair", required: false },
      { id: "photos", type: "photo", label: "Photos of any damage or areas of concern", required: false },
      { id: "inspector_name", type: "text", label: "Inspector name", required: true },
    ],
  },
  {
    title: "Vehicle Pre-start Inspection",
    description: "Daily vehicle pre-start safety check for field crews.",
    fields: [
      { id: "lights_working", type: "checkbox", label: "All lights working (headlights, indicators, brake lights)", required: true },
      { id: "tyres_ok", type: "checkbox", label: "Tyre condition and pressure checked", required: true },
      { id: "fluid_levels", type: "checkbox", label: "Oil, coolant, and brake fluid levels checked", required: true },
      { id: "mirrors_adjusted", type: "checkbox", label: "Mirrors and windows clean and adjusted", required: true },
      { id: "seatbelts_ok", type: "checkbox", label: "Seatbelts functional", required: true },
      { id: "vehicle_damage", type: "textarea", label: "Existing damage or defects noted (describe or write None)", required: true },
      { id: "odometer", type: "text", label: "Odometer reading (km)", required: true },
      { id: "driver_name", type: "text", label: "Driver name", required: true },
    ],
  },
  {
    title: "Asbestos Safety Register",
    description: "Pre-work asbestos identification and safety record.",
    fields: [
      { id: "asbestos_suspected", type: "checkbox", label: "Asbestos-containing materials (ACM) suspected on site", required: true },
      { id: "licensed_removalist", type: "checkbox", label: "Licensed asbestos removalist engaged (if ACM confirmed)", required: false },
      { id: "air_monitoring", type: "checkbox", label: "Air monitoring conducted or not required", required: true },
      { id: "workers_notified", type: "checkbox", label: "All workers notified of potential ACM presence", required: true },
      { id: "ppe_provided", type: "checkbox", label: "Appropriate PPE provided to all workers on site", required: true },
      { id: "location_description", type: "textarea", label: "Location and condition of suspected ACM", required: false },
      { id: "site_supervisor", type: "text", label: "Site supervisor name", required: true },
      { id: "signature", type: "signature", label: "Site supervisor signature", required: true },
    ],
  },
  {
    title: "Client Satisfaction Sign-off",
    description: "Post-job client acceptance and satisfaction form.",
    fields: [
      { id: "work_complete", type: "checkbox", label: "All agreed work has been completed to satisfaction", required: true },
      { id: "site_clean", type: "checkbox", label: "Work area has been left clean and tidy", required: true },
      { id: "issues_raised", type: "textarea", label: "Any issues, concerns or follow-up items (write None if none)", required: true },
      { id: "rating", type: "select", label: "Overall satisfaction rating", required: true, options: ["5 — Excellent", "4 — Good", "3 — Satisfactory", "2 — Below expectations", "1 — Poor"] },
      { id: "client_name", type: "text", label: "Client name", required: true },
      { id: "signature", type: "signature", label: "Client signature", required: true },
    ],
  },
  {
    title: "Hot Work Permit",
    description: "Permit required before any welding, cutting, or grinding that produces heat or sparks.",
    fields: [
      { id: "fire_extinguisher", type: "checkbox", label: "Fire extinguisher positioned within 10m of work area", required: true },
      { id: "flammables_removed", type: "checkbox", label: "Flammable materials removed or protected within 10m", required: true },
      { id: "fire_watch_assigned", type: "checkbox", label: "Fire watch assigned and will remain for 30 min after work", required: true },
      { id: "ventilation_adequate", type: "checkbox", label: "Adequate ventilation is in place", required: true },
      { id: "hot_work_type", type: "select", label: "Type of hot work", required: true, options: ["Welding", "Cutting", "Grinding", "Soldering", "Other"] },
      { id: "permit_valid_until", type: "text", label: "Permit valid until (date/time)", required: true },
      { id: "authorised_by", type: "text", label: "Authorised by", required: true },
      { id: "signature", type: "signature", label: "Authorised person signature", required: true },
    ],
  },
];
