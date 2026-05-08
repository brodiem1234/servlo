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

  // ── 10 additional templates (Wave 2) ─────────────────────────────────────
  {
    title: "Commercial Cleaning — Pre-Clean Safety Assessment",
    description: "Pre-work safety check for commercial cleaning crews. Starting template — customise for your business and verify compliance with current Australian regulations. Not legal advice.",
    fields: [
      { id: "site_name", type: "text", label: "Site Name & Address", required: true },
      { id: "ppe_available", type: "checkbox", label: "PPE (gloves, goggles) available and inspected", required: true },
      { id: "sds_on_site", type: "checkbox", label: "Chemical safety data sheets (SDS) on-site", required: true },
      { id: "chemicals_used", type: "text", label: "Chemicals to be used", required: true },
      { id: "wet_floor_signs", type: "checkbox", label: "Wet floor signs available", required: true },
      { id: "hazards", type: "textarea", label: "Hazards identified", required: false },
      { id: "signature", type: "signature", label: "Cleaner Signature", required: true },
    ],
  },
  {
    title: "Mobile Mechanic — Vehicle Pre-Inspection Report",
    description: "Pre-work vehicle inspection for mobile mechanics. Starting template — customise for your business and verify compliance with current Australian regulations. Not legal advice.",
    fields: [
      { id: "vehicle_details", type: "text", label: "Vehicle Make, Model, Year", required: true },
      { id: "vin_rego", type: "text", label: "VIN / Rego Number", required: true },
      { id: "odometer", type: "text", label: "Odometer Reading", required: true },
      { id: "customer_faults", type: "textarea", label: "Faults reported by customer", required: true },
      { id: "additional_faults", type: "textarea", label: "Additional faults found on inspection", required: false },
      { id: "recommended_work", type: "text", label: "Recommended work", required: true },
      { id: "signature", type: "signature", label: "Mechanic Signature", required: true },
    ],
  },
  {
    title: "Pest Control — Chemical Hazard Identification",
    description: "Chemical hazard identification for pest control operators. Starting template — customise for your business and verify compliance with current Australian regulations. Not legal advice.",
    fields: [
      { id: "treatment_site", type: "text", label: "Treatment Site Address", required: true },
      { id: "target_pests", type: "text", label: "Target Pest(s)", required: true },
      { id: "chemicals", type: "text", label: "Chemical(s) to be used (with APVMA reg no.)", required: true },
      { id: "sds_reviewed", type: "checkbox", label: "SDS reviewed and available on-site", required: true },
      { id: "residents_evacuated", type: "checkbox", label: "Residents / pets evacuated if required", required: true },
      { id: "re_entry_period", type: "text", label: "Re-entry period communicated", required: true },
      { id: "signature", type: "signature", label: "Licensed Pest Controller", required: true },
    ],
  },
  {
    title: "Locksmith — Key Register and Audit Trail",
    description: "Key register and audit trail for locksmith services. Starting template — customise for your business and verify compliance with current Australian regulations. Not legal advice.",
    fields: [
      { id: "property_address", type: "text", label: "Property Address", required: true },
      { id: "key_description", type: "text", label: "Key/Lock Description", required: true },
      { id: "keys_cut", type: "text", label: "Number of keys cut", required: true },
      { id: "key_holders", type: "text", label: "Key holder name(s)", required: true },
      { id: "purpose", type: "text", label: "Purpose of work", required: true },
      { id: "id_confirmed", type: "checkbox", label: "Proof of identity / authority confirmed", required: true },
      { id: "customer_signature", type: "signature", label: "Customer Signature", required: true },
    ],
  },
  {
    title: "Pool & Spa — Water Chemistry Log",
    description: "Water chemistry log for pool and spa technicians. Starting template — customise for your business and verify compliance with current Australian regulations. Not legal advice.",
    fields: [
      { id: "pool_location", type: "text", label: "Pool / Spa Location", required: true },
      { id: "test_date", type: "text", label: "Date of Test", required: true },
      { id: "free_chlorine", type: "text", label: "Free Chlorine (ppm)", required: true },
      { id: "ph_level", type: "text", label: "pH Level", required: true },
      { id: "total_alkalinity", type: "text", label: "Total Alkalinity (ppm)", required: false },
      { id: "cyanuric_acid", type: "text", label: "Cyanuric Acid (ppm)", required: false },
      { id: "chemicals_added", type: "textarea", label: "Chemicals added and quantities", required: false },
      { id: "next_service", type: "text", label: "Next service due", required: false },
      { id: "signature", type: "signature", label: "Technician Signature", required: true },
    ],
  },
  {
    title: "Carpet Cleaning — Pre-Clean Condition Report",
    description: "Pre-clean condition report for carpet cleaning. Starting template — customise for your business and verify compliance with current Australian regulations. Not legal advice.",
    fields: [
      { id: "property_address", type: "text", label: "Property Address", required: true },
      { id: "pre_existing", type: "textarea", label: "Pre-existing stains / damage noted", required: true },
      { id: "carpet_type", type: "text", label: "Carpet type / fibre", required: false },
      { id: "customer_acknowledged", type: "checkbox", label: "Customer acknowledged pre-existing conditions", required: true },
      { id: "areas_to_clean", type: "text", label: "Areas to be cleaned", required: true },
      { id: "customer_signature", type: "signature", label: "Customer Signature", required: true },
    ],
  },
  {
    title: "Landscaping — Site Safety and Equipment Check",
    description: "Site safety and equipment check for landscaping crews. Starting template — customise for your business and verify compliance with current Australian regulations. Not legal advice.",
    fields: [
      { id: "site_address", type: "text", label: "Site Address", required: true },
      { id: "dial_before_dig", type: "checkbox", label: "Call Before You Dig check completed if excavating", required: true },
      { id: "equipment_inspected", type: "checkbox", label: "Equipment (mowers, blowers, chainsaws) inspected", required: true },
      { id: "ppe_in_use", type: "checkbox", label: "PPE (hearing protection, safety boots) in use", required: true },
      { id: "hazards", type: "textarea", label: "Hazards identified (slopes, buried services, traffic)", required: true },
      { id: "controls", type: "textarea", label: "Controls implemented", required: true },
      { id: "signature", type: "signature", label: "Worker Signature", required: true },
    ],
  },
  {
    title: "Appliance Repair — Fault Diagnosis and Repair Record",
    description: "Fault diagnosis and repair record for appliance technicians. Starting template — customise for your business and verify compliance with current Australian regulations. Not legal advice.",
    fields: [
      { id: "appliance_details", type: "text", label: "Appliance Brand, Model, Serial No.", required: true },
      { id: "customer_fault", type: "text", label: "Customer Reported Fault", required: true },
      { id: "diagnosis", type: "textarea", label: "Diagnosis Findings", required: true },
      { id: "work_performed", type: "textarea", label: "Work Performed", required: true },
      { id: "parts_replaced", type: "text", label: "Parts Replaced (with part numbers)", required: false },
      { id: "warranty", type: "text", label: "Warranty on Repair", required: false },
      { id: "signature", type: "signature", label: "Technician Signature", required: true },
    ],
  },
  {
    title: "Waste Removal — Manifest and Disposal Record",
    description: "Waste manifest and disposal record for waste removal operators. Starting template — customise for your business and verify compliance with current Australian regulations. Not legal advice.",
    fields: [
      { id: "collection_address", type: "text", label: "Collection Address", required: true },
      { id: "waste_types", type: "text", label: "Waste Type(s)", required: true },
      { id: "volume_weight", type: "text", label: "Estimated Volume / Weight", required: true },
      { id: "disposal_facility", type: "text", label: "Disposal Facility Name and Address", required: true },
      { id: "hazardous_handled", type: "checkbox", label: "Hazardous waste identified and handled correctly", required: true },
      { id: "licence_number", type: "text", label: "Licence / permit number if applicable", required: false },
      { id: "signature", type: "signature", label: "Operator Signature", required: true },
    ],
  },
  {
    title: "Painting — Surface Preparation and Condition Assessment",
    description: "Surface preparation and condition assessment for painters. Starting template — customise for your business and verify compliance with current Australian regulations. Not legal advice.",
    fields: [
      { id: "property_address", type: "text", label: "Property Address", required: true },
      { id: "areas_to_paint", type: "text", label: "Areas to be painted", required: true },
      { id: "surface_condition", type: "textarea", label: "Surface condition (cracks, mould, peeling noted)", required: true },
      { id: "preparation", type: "text", label: "Preparation required", required: true },
      { id: "paint_details", type: "text", label: "Paint brand, colour, sheen level", required: false },
      { id: "lead_tested", type: "checkbox", label: "Lead paint tested / assessed if pre-1970 building", required: false },
      { id: "customer_signature", type: "signature", label: "Customer Signature", required: true },
    ],
  },
];
