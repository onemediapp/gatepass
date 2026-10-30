/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SPECIALTIES_DATA = [
  {
    category: 'Cardiology',
    subSpecialties: [
      'Interventional Cardiology',
      'Clinical Cardiology',
      'Electrophysiology & Arrhythmia',
      'Heart Failure & Cardiomyopathy',
      'Preventive & Lipidology',
      'Pediatric Cardiology',
      'Cardio-Thoracic Surgery'
    ]
  },
  {
    category: 'Diabetology & Endocrinology',
    subSpecialties: [
      'Type 2 Diabetes Mellitus',
      'Type 1 Diabetes',
      'Thyroid Disorders',
      'Gestational Diabetes (GDM)',
      'Metabolic Syndrome & Obesity',
      'Osteoporosis & Bone Metabolism',
      'Pediatric Endocrinology'
    ]
  },
  {
    category: 'General Medicine & Internal',
    subSpecialties: [
      'Internal Medicine',
      'Critical Care / ICU',
      'Infectious Diseases',
      'Geriatric Medicine',
      'Hypertension & Vascular Medicine',
      'Family Medicine'
    ]
  },
  {
    category: 'Gastroenterology & Hepatology',
    subSpecialties: [
      'Clinical Gastroenterology',
      'Hepatology & Liver Care',
      'Therapeutic Endoscopy',
      'Inflammatory Bowel Disease (IBD)',
      'GI Motility & Dyspepsia',
      'Surgical Gastroenterology'
    ]
  },
  {
    category: 'Neurology & Neuro Surgery',
    subSpecialties: [
      'Stroke & Cerebrovascular',
      'Epilepsy & Seizures',
      'Headache & Migraine',
      'Movement Disorders & Parkinson’s',
      'Neuro-immunology & Multiple Sclerosis',
      'Neurosurgery & Spine'
    ]
  },
  {
    category: 'Orthopedics & Joint Care',
    subSpecialties: [
      'Joint Replacement & Arthroplasty',
      'Spine Surgery',
      'Sports Medicine & Arthroscopy',
      'Trauma & Fracture Care',
      'Pediatric Orthopedics',
      'Bone Health & Osteoarthritis'
    ]
  },
  {
    category: 'Pulmonology & Respiratory',
    subSpecialties: [
      'Asthma & Allergy',
      'COPD & Emphysema',
      'Sleep Medicine & Apnea',
      'Interstitial Lung Disease (ILD)',
      'Tuberculosis & Chest Infections',
      'Interventional Pulmonology'
    ]
  },
  {
    category: 'Pediatrics & Neonatology',
    subSpecialties: [
      'General Pediatrics',
      'Neonatal Intensive Care (NICU)',
      'Pediatric Pulmonology & Asthma',
      'Pediatric Nutrition',
      'Pediatric Infectious Diseases',
      'Developmental Pediatrics'
    ]
  },
  {
    category: 'Gynecology & Obstetrics',
    subSpecialties: [
      'Obstetrics & Antenatal Care',
      'High-Risk Pregnancy',
      'Infertility & Assisted Reproduction (IVF)',
      'Laparoscopic Gynaec Surgery',
      'PCOS & Adolescent Gynaecology',
      'Gynaecologic Oncology'
    ]
  },
  {
    category: 'Dermatology & Cosmetology',
    subSpecialties: [
      'Clinical Dermatology',
      'Trichology & Hair Loss',
      'Cosmetology & Aesthetics',
      'Pediatric Dermatology',
      'Dermatosurgery & Laser',
      'Psoriasis & Vitiligo Clinic'
    ]
  },
  {
    category: 'Nephrology & Urology',
    subSpecialties: [
      'Chronic Kidney Disease (CKD)',
      'Hemodialysis & Peritoneal Dialysis',
      'Kidney Transplantation',
      'Endourology & Kidney Stones',
      'Uro-Oncology & Prostate Care',
      'Andrology & Men’s Health'
    ]
  },
  {
    category: 'Oncology & Hematology',
    subSpecialties: [
      'Medical Oncology & Chemotherapy',
      'Radiation Oncology',
      'Surgical Oncology',
      'Hematology & Blood Cancers',
      'Palliative & Supportive Care',
      'Immunotherapy'
    ]
  },
  {
    category: 'Psychiatry & Mental Health',
    subSpecialties: [
      'General Adult Psychiatry',
      'Anxiety & Depressive Disorders',
      'De-Addiction Medicine',
      'Child & Adolescent Psychiatry',
      'Neuro-Psychiatry & Dementia'
    ]
  },
  {
    category: 'ENT (Otorhinolaryngology)',
    subSpecialties: [
      'Otology & Ear Surgery',
      'Rhinology & Sinus Surgery',
      'Laryngology & Voice Disorders',
      'Vertigo & Balance Disorders',
      'Head & Neck Surgery'
    ]
  },
  {
    category: 'Ophthalmology',
    subSpecialties: [
      'Cataract & Refractive Surgery',
      'Medical & Surgical Retina',
      'Glaucoma Care',
      'Cornea & External Eye Diseases',
      'Pediatric Ophthalmology'
    ]
  },
  {
    category: 'Dentistry',
    subSpecialties: [
      'General Dentistry',
      'Orthodontics',
      'Periodontics & Gum Care',
      'Endodontics & Root Canal',
      'Oral & Maxillofacial Surgery'
    ]
  }
];

export const ALL_SPECIALTY_NAMES = SPECIALTIES_DATA.map(s => s.category);
export const SPECIALS_DATA = SPECIALTIES_DATA;
