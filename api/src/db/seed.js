/**
 * Seed AfyaPack database with protocol documents and demo data.
 * Run with: node src/db/seed.js
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initDB, getDB } = require('./index');
const { ingestProtocols } = require('../services/retrieval');

// ─── Protocol Documents ──────────────────────────────────────────────────────

const PROTOCOLS = [
  {
    id: 'fever-dehydration-children',
    title: 'Fever and Dehydration in Children',
    tags: ['fever', 'dehydration', 'children', 'paediatric'],
    sections: [
      {
        heading: 'Overview',
        text: 'Fever in children under 5 years is a common presenting complaint at community health facilities. Temperature above 37.5°C is considered a fever. High fever above 39°C requires prompt assessment and management. Dehydration often accompanies fever due to increased fluid losses.',
      },
      {
        heading: 'Danger Signs — Immediate Referral Required',
        text: 'Refer immediately if any of the following are present: convulsions or history of convulsions, inability to drink or breastfeed, vomiting everything, lethargic or unconscious child, stiff neck, bulging fontanelle in infants, rash with fever, temperature above 40°C, grunting or difficulty breathing.',
      },
      {
        heading: 'Dehydration Assessment',
        text: 'Assess dehydration using the IMCI criteria. No dehydration: child is well, alert, normal skin turgor, normal eyes and mouth. Some dehydration: restless or irritable, sunken eyes, drinks eagerly, skin pinch returns slowly. Severe dehydration: lethargic or unconscious, sunken eyes, drinks poorly or unable to drink, skin pinch returns very slowly (more than 2 seconds).',
      },
      {
        heading: 'Management of Fever',
        text: 'Give paracetamol for fever above 38.5°C. Dosing: 15 mg/kg per dose every 4-6 hours, maximum 4 doses per 24 hours. Do NOT give aspirin to children under 12 years. Encourage oral fluids. Tepid sponging may be used for comfort. Remove excess clothing.',
      },
      {
        heading: 'Oral Rehydration Therapy (ORT)',
        text: 'For some dehydration: give ORS solution 75 ml/kg over 4 hours. For infants under 6 months: continue breastfeeding. Reassess after 4 hours. For no dehydration with diarrhoea: give extra fluids at home using ORS or home fluids. Show mother how to prepare ORS. Give zinc supplementation for diarrhoea.',
      },
      {
        heading: 'Malaria Consideration',
        text: 'In malaria-endemic areas, all children with fever should be tested with a rapid diagnostic test (RDT) if available. If RDT positive, treat according to national malaria treatment protocol. If RDT not available and malaria risk is high, treat presumptively per local guidelines. Document and refer if no improvement within 24 hours of treatment.',
      },
      {
        heading: 'Follow-Up',
        text: 'Child should be reviewed if: fever persists beyond 2 days, condition worsens at any time, child cannot drink or take medicines, child develops any danger signs. Advise caretaker to return immediately if any danger sign develops.',
      },
    ],
  },

  {
    id: 'maternal-warning-signs',
    title: 'Maternal Warning Signs and Emergency Referral',
    tags: ['maternal', 'pregnancy', 'antenatal', 'emergency', 'referral'],
    sections: [
      {
        heading: 'Overview',
        text: 'Maternal warning signs are clinical indicators that a pregnant or postpartum woman may be developing a serious complication. Early recognition and rapid referral are critical to preventing maternal death. All frontline workers must be able to identify these warning signs.',
      },
      {
        heading: 'Urgent Referral — IMMEDIATE Action Required',
        text: 'Refer immediately for any of the following: heavy vaginal bleeding at any stage of pregnancy or postpartum (soaking more than one pad per hour), severe headache with visual disturbance (blurring, flashes), facial or hand swelling with headache especially after 20 weeks, seizures or loss of consciousness, fever above 38°C with foul-smelling vaginal discharge, reduced or absent fetal movements after 28 weeks, cord prolapse, placenta not delivered within 30 minutes of birth, shock signs.',
      },
      {
        heading: 'Pre-eclampsia and Eclampsia',
        text: 'Pre-eclampsia presents with high blood pressure (140/90 or higher) after 20 weeks of pregnancy with protein in urine, and may include severe headache, visual changes, epigastric pain, and swelling. Eclampsia is pre-eclampsia with seizures. These are life-threatening emergencies. Refer immediately. If eclampsia: protect airway, turn patient on side, do not restrain, give magnesium sulfate only if trained.',
      },
      {
        heading: 'Postpartum Haemorrhage',
        text: 'Postpartum haemorrhage (PPH) is defined as blood loss of 500 ml or more after vaginal birth, or 1000 ml after caesarean. Signs include excessive bleeding, soft uterus (uterine atony), signs of shock. First-line management: massage uterus firmly, give oxytocin 10 IU IM if available, refer urgently. Retain placenta for inspection. Keep woman warm and lying down.',
      },
      {
        heading: 'Sepsis in Pregnancy',
        text: 'Signs of sepsis: high fever above 38°C or low temperature below 36°C, rapid pulse above 100, rapid breathing, altered consciousness, foul-smelling discharge. Risk is highest after delivery, abortion, or prolonged rupture of membranes. Do NOT delay referral for sepsis. Give first dose of antibiotics only if trained and equipped and referral will be delayed.',
      },
      {
        heading: 'Antenatal Danger Signs',
        text: 'Refer for antenatal assessment if: no fetal movement after 28 weeks for more than 12 hours, leaking fluid before 37 weeks, vaginal bleeding at any gestational age, persistent vomiting preventing oral intake, severe abdominal pain, signs of anaemia (pallor, extreme weakness, breathlessness at rest), blood pressure reading of 140/90 or higher.',
      },
    ],
  },

  {
    id: 'referral-triggers',
    title: 'Community Referral Criteria and Escalation Guide',
    tags: ['referral', 'escalation', 'emergency', 'general'],
    sections: [
      {
        heading: 'When to Refer — General Principles',
        text: 'Refer any patient when: condition is beyond your training or scope, danger signs are present, patient is not improving after 24-48 hours, a procedure or investigation is needed that is not available, or the patient or family requests referral. When in doubt, refer.',
      },
      {
        heading: 'ABCDE Danger Sign Framework',
        text: 'Use ABCDE to identify priority referrals. Airway: stridor, drooling, complete obstruction. Breathing: severe difficulty, cyanosis, unable to speak in full sentences. Circulation: signs of shock — pale cold skin, weak rapid pulse, low blood pressure, altered consciousness. Disability: seizures, loss of consciousness, confusion, focal neurological signs. Exposure: major trauma, severe bleeding, burns.',
      },
      {
        heading: 'Vital Sign Thresholds for Referral',
        text: 'Refer urgently if any of the following: temperature above 40°C or below 35.5°C, pulse rate above 120 beats per minute or below 50, respiratory rate above 30 breaths per minute or below 10, oxygen saturation below 94% if measured, blood pressure systolic below 90 mmHg or above 160 mmHg, blood glucose below 3.5 mmol/L.',
      },
      {
        heading: 'Paediatric Referral Criteria',
        text: 'Refer any child under 5 with: inability to feed or drink, vomiting everything taken, convulsions, lethargic or unconscious, severe respiratory distress, severe dehydration, severe malnutrition (MUAC below 115 mm), any danger sign per IMCI guidelines, suspected meningitis, severe skin infections.',
      },
      {
        heading: 'Referral Communication',
        text: 'When referring a patient always: provide a written referral note with patient details, presenting complaint, vital signs, danger signs, any treatment given and time, and your name and facility. Accompany the patient or arrange for a responsible person to do so. Call ahead to the receiving facility if possible. Document the referral in your register.',
      },
      {
        heading: 'Routine vs Urgent Referral',
        text: 'URGENT referral (within 1-2 hours): any life-threatening danger sign, eclampsia, PPH, major trauma, severe dehydration in child, chest pain, stroke symptoms. SAME DAY referral: persistent high fever, suspected TB, malnutrition, uncontrolled chronic disease, complicated wound. ROUTINE referral (within a week): stable chronic conditions, planned procedures, specialist review needed.',
      },
    ],
  },

  {
    id: 'community-care-followup',
    title: 'Community Care and Follow-Up Guidelines',
    tags: ['community', 'followup', 'chronic', 'preventive'],
    sections: [
      {
        heading: 'Home Management Principles',
        text: 'Home management is appropriate when: the patient is alert and able to take oral medications, there are no danger signs, a responsible caretaker is available, the caretaker understands the return signs, and the patient can return for review within 24-48 hours if needed.',
      },
      {
        heading: 'Oral Fluid Recommendations',
        text: 'For mild illness with risk of dehydration: encourage frequent small sips of clean water, oral rehydration solution, or clear broth. Avoid sugary drinks. Breastfeed more frequently for infants. Give ORS: children under 2 years — 50-100 ml after each loose stool; children 2-10 years — 100-200 ml after each loose stool; adults — drink freely. Reassess if fluids not tolerated.',
      },
      {
        heading: 'Return to Care Signs',
        text: 'Instruct the caretaker or patient to return immediately if: the patient is unable to eat or drink, vomiting all fluids, becomes more lethargic or confused, develops convulsions, develops any new danger sign, condition worsens at any time, fever persists for more than 2 days despite treatment, rash or jaundice develops.',
      },
      {
        heading: 'Wound and Skin Care',
        text: 'Clean wounds with clean water and mild soap. Remove visible debris gently. Apply simple dressing if available. Change dressing daily or when wet or soiled. Signs of wound infection requiring referral: increasing redness spreading beyond wound edges, warmth, swelling, pus discharge, red streaks from wound, fever, lymph node swelling.',
      },
      {
        heading: 'Chronic Disease Follow-Up',
        text: 'Patients with known chronic conditions (hypertension, diabetes, HIV, TB) need regular follow-up. Check that they have adequate medication supply — at least 2 weeks supply. Reinforce adherence. Check for side effects. Check for complications. Refer to higher facility if: defaulting on treatment, new complications, medication not available at community level.',
      },
    ],
  },

  {
    id: 'essential-medicines',
    title: 'Essential Medicines — Community Health Level',
    tags: ['medicines', 'stock', 'pharmacy', 'dosing'],
    sections: [
      {
        heading: 'Core Medicine List',
        text: 'The following medicines form the essential community health kit: Oral rehydration salts (ORS), Zinc sulfate 20mg tablets, Paracetamol 500mg tablets and 125mg/5ml syrup, Amoxicillin 250mg capsules and 125mg/5ml suspension, Artemether-Lumefantrine (AL) for malaria, Cotrimoxazole 480mg tablets, Iron and folic acid tablets, Vitamin A capsules, Mebendazole 500mg, Condoms, Chlorhexidine for cord care, Oxytocin 10 IU for trained birth attendants.',
      },
      {
        heading: 'Stock Management Principles',
        text: 'Maintain a minimum stock of 1 month supply for each item. Record all issues and receipts in the stock register. Conduct physical stock count weekly. Reorder when stock falls to the reorder level (typically 2 weeks supply). Store medicines in a cool dry place away from direct sunlight. Check expiry dates monthly. Dispose of expired medicines according to local protocol.',
      },
      {
        heading: 'Low Stock Action',
        text: 'When any essential medicine falls below minimum stock level: document in stock register, notify supervisor immediately, request emergency resupply, inform patients if medicine is unavailable and advise where to obtain it, document any treatment delays due to stockouts. Do not issue partial treatment courses unless a full course is unavailable and partial is better than none.',
      },
      {
        heading: 'Paracetamol Dosing Guide',
        text: 'Paracetamol dose: 15 mg/kg per dose. Maximum 4 doses per 24 hours. Minimum 4 hours between doses. Standard doses: 3-6 months (5-8 kg) — 60-80 mg; 6-24 months (8-13 kg) — 120 mg; 2-6 years (13-20 kg) — 180-250 mg; 6-12 years (20-40 kg) — 300-500 mg; Adults — 500-1000 mg. Do NOT exceed recommended dose. Do NOT give to infants under 3 months without clinical advice.',
      },
    ],
  },
];

// ─── Demo Stock Data ──────────────────────────────────────────────────────────

const DEMO_STOCK = [
  { name: 'Oral Rehydration Salts (ORS)', category: 'medicine', quantity: 45, unit: 'sachets', low_threshold: 20 },
  { name: 'Paracetamol 500mg', category: 'medicine', quantity: 8, unit: 'strips', low_threshold: 15 },
  { name: 'Amoxicillin 250mg', category: 'medicine', quantity: 3, unit: 'bottles', low_threshold: 5 },
  { name: 'Artemether-Lumefantrine (AL)', category: 'medicine', quantity: 12, unit: 'packs', low_threshold: 10 },
  { name: 'Zinc Sulfate 20mg', category: 'medicine', quantity: 2, unit: 'strips', low_threshold: 10 },
  { name: 'Cotrimoxazole 480mg', category: 'medicine', quantity: 28, unit: 'tablets', low_threshold: 20 },
  { name: 'Iron + Folic Acid', category: 'medicine', quantity: 60, unit: 'tablets', low_threshold: 30 },
  { name: 'Mebendazole 500mg', category: 'medicine', quantity: 22, unit: 'tablets', low_threshold: 10 },
  { name: 'Rapid Diagnostic Tests (RDT)', category: 'consumable', quantity: 7, unit: 'kits', low_threshold: 10 },
  { name: 'Gloves (pairs)', category: 'consumable', quantity: 35, unit: 'pairs', low_threshold: 20 },
  { name: 'Gauze Dressings', category: 'consumable', quantity: 15, unit: 'packs', low_threshold: 10 },
  { name: 'Oxytocin 10 IU/ml', category: 'medicine', quantity: 4, unit: 'vials', low_threshold: 5 },
];

// ─── Demo Encounters ──────────────────────────────────────────────────────────

const DEMO_ENCOUNTERS = [
  {
    id: 'enc-demo-001',
    age: 2,
    sex: 'male',
    pregnant: 0,
    symptoms: JSON.stringify(['fever', 'diarrhoea', 'reduced feeding', 'sunken eyes']),
    duration: '2 days',
    temperature: 39.2,
    pulse: 118,
    danger_signs: JSON.stringify(['sunken eyes', 'skin pinch returns slowly']),
    notes: 'Child has had loose stools 5 times today. Not breastfeeding well.',
    red_flags: JSON.stringify([
      { severity: 'critical', message: 'High fever (39.2°C) — assess for malaria', rule: 'temperature' },
      { severity: 'high', message: 'Signs of some dehydration — initiate ORT', rule: 'dehydration_sign' },
      { severity: 'high', message: 'Tachycardia — monitor closely', rule: 'pulse' },
    ]),
    status: 'draft',
  },
  {
    id: 'enc-demo-002',
    age: 26,
    sex: 'female',
    pregnant: 1,
    symptoms: JSON.stringify(['severe headache', 'blurred vision', 'facial swelling', 'epigastric pain']),
    duration: '1 day',
    temperature: 37.8,
    pulse: 95,
    danger_signs: JSON.stringify(['severe headache with visual disturbance', 'facial oedema']),
    notes: '28 weeks gestation. First pregnancy. BP measured 150/100 at last visit.',
    red_flags: JSON.stringify([
      { severity: 'critical', message: 'URGENT — Possible pre-eclampsia. Immediate referral required', rule: 'preeclampsia' },
      { severity: 'critical', message: 'Severe headache with visual disturbance in pregnancy — REFER NOW', rule: 'maternal_danger' },
    ]),
    status: 'draft',
  },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function seedDatabase() {
  console.log('[Seed] Starting database seed...');

  await initDB();
  const db = getDB();

  // Seed protocols
  console.log('[Seed] Ingesting protocol documents...');
  ingestProtocols(PROTOCOLS);

  // Seed stock (only if empty)
  const stockCount = db.prepare('SELECT COUNT(*) as count FROM stock').get();
  if (stockCount.count === 0) {
    console.log('[Seed] Seeding stock data...');
    const insertStock = db.prepare(`
      INSERT INTO stock (name, category, quantity, unit, low_threshold)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertManyStock = db.transaction(items => {
      items.forEach(item => {
        insertStock.run(item.name, item.category, item.quantity, item.unit, item.low_threshold);
      });
    });
    insertManyStock(DEMO_STOCK);
    console.log(`[Seed] Seeded ${DEMO_STOCK.length} stock items`);
  }

  // Seed demo encounters (only if empty)
  const encCount = db.prepare('SELECT COUNT(*) as count FROM encounters').get();
  if (encCount.count === 0) {
    console.log('[Seed] Seeding demo encounters...');
    const insertEnc = db.prepare(`
      INSERT INTO encounters
        (id, age, sex, pregnant, symptoms, duration, temperature, pulse, danger_signs, notes, red_flags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction(encs => {
      encs.forEach(e => {
        insertEnc.run(
          e.id, e.age, e.sex, e.pregnant, e.symptoms, e.duration,
          e.temperature, e.pulse, e.danger_signs, e.notes, e.red_flags, e.status,
        );
      });
    });
    insertMany(DEMO_ENCOUNTERS);
    console.log(`[Seed] Seeded ${DEMO_ENCOUNTERS.length} demo encounters`);
  }

  // Set default settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);
  insertSetting.run('language', 'en');
  insertSetting.run('seeded_at', new Date().toISOString());
  insertSetting.run('protocol_count', String(PROTOCOLS.length));

  console.log('[Seed] Database seed complete.');
}

// Run directly if called as main
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed complete.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase, PROTOCOLS };
