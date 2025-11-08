export interface VisaDocument {
  type: string;
  displayName: string;
  required: boolean;
  description?: string;
}

export interface VisaType {
  code: string;
  name: string;
  description: string;
  minSalary?: number;
  currency?: string;
  requiredDocuments: VisaDocument[];
  processingTime?: string;
  validityPeriod?: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  visaTypes: VisaType[];
}

export const VISA_CONFIG: Country[] = [
  {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    visaTypes: [
      {
        code: 'CSEP',
        name: 'Critical Skills Employment Permit',
        description: 'For highly skilled workers in occupations on the Critical Skills Occupation List',
        minSalary: 38000,
        currency: 'EUR',
        processingTime: '12 weeks',
        validityPeriod: '2 years',
        requiredDocuments: [
          { type: 'passport', displayName: 'Valid Passport', required: true, description: 'Passport showing picture, signature, and personal details' },
          { type: 'resume', displayName: 'Detailed CV/Resume', required: true, description: 'Comprehensive curriculum vitae' },
          { type: 'academic_certificates', displayName: 'Academic Certificates', required: true, description: 'Educational qualifications' },
          { type: 'professional_qualifications', displayName: 'Professional Qualifications', required: true, description: 'Relevant professional certifications' },
          { type: 'work_experience', displayName: 'Work Experience Certificates', required: true, description: 'Demonstrating relevant previous experience' },
          { type: 'job_offer', displayName: 'Job Offer Letter', required: true, description: 'From the Irish employer' },
          { type: 'employment_contract', displayName: 'Employment Contract', required: true, description: 'Signed work contract between you and employer' },
          { type: 'photograph', displayName: 'Passport-size Photograph', required: true, description: 'Meeting Ireland photo requirements' }
        ]
      }
    ]
  },
  {
    code: 'PL',
    name: 'Poland',
    flag: '🇵🇱',
    visaTypes: [
      {
        code: 'WP_TYPE_C',
        name: 'Work Permit Type C',
        description: 'For employees of foreign companies posted to Poland for over 30 days annually',
        processingTime: '1-6 months',
        validityPeriod: 'Up to 3 years',
        requiredDocuments: [
          { type: 'application_form', displayName: 'Work Permit Application Form', required: true, description: 'Completed and signed application' },
          { type: 'passport', displayName: 'Valid Travel Document', required: true, description: 'Copy of all filled pages from valid passport' },
          { type: 'legal_status_document', displayName: 'Legal Status Document', required: true, description: 'Confirming legal status of foreign employer' },
          { type: 'relationship_documents', displayName: 'Relationship Documents', required: true, description: 'Confirming relationship between foreign and domestic company' },
          { type: 'employment_proof', displayName: 'Employment Proof', required: true, description: 'Document confirming employment in foreign entity' },
          { type: 'foreign_entity_statement', displayName: 'Foreign Entity Statement', required: true, description: 'Indicating authorized representative in Poland' },
          { type: 'delegation_document', displayName: 'Delegation Document', required: true, description: 'Confirming delegation to Poland for work' }
        ]
      }
    ]
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    visaTypes: [
      {
        code: 'TALENT_PASSPORT',
        name: 'Talent Passport',
        description: 'For highly qualified professionals, researchers, and entrepreneurs',
        minSalary: 39582,
        currency: 'EUR',
        processingTime: '2-3 months',
        validityPeriod: '4 years',
        requiredDocuments: [
          { type: 'passport', displayName: 'Valid Passport', required: true, description: 'Showing personal details, validity dates, and entry stamps' },
          { type: 'visa_form', displayName: 'Long-Stay Visa Form', required: true, description: 'Completed visa application form' },
          { type: 'photographs', displayName: 'Photographs', required: true, description: 'Three photos with e-photo code' },
          { type: 'proof_of_address', displayName: 'Proof of Address', required: true, description: 'Less than 6 months old' },
          { type: 'employer_form', displayName: 'Employer Form 15616*01', required: true, description: 'Filled by future employer with company documents' },
          { type: 'employment_contract', displayName: 'Employment Contract', required: false, description: 'Or promise of employment' }
        ]
      },
      {
        code: 'SALARIE_MISSION',
        name: 'Salarié en Mission',
        description: 'For employees on intra-company transfer',
        minSalary: 39582,
        currency: 'EUR',
        processingTime: '2-3 months',
        validityPeriod: 'Up to 3 years',
        requiredDocuments: [
          { type: 'passport', displayName: 'Valid Passport', required: true, description: 'Valid travel document' },
          { type: 'visa_form', displayName: 'Long-Stay Visa Form', required: true, description: 'Completed visa application' },
          { type: 'photographs', displayName: 'Photographs', required: true, description: 'Three passport photos' },
          { type: 'employment_contract', displayName: 'Employment Contract', required: true, description: 'From French entity' },
          { type: 'transfer_documents', displayName: 'Transfer Documents', required: true, description: 'Proving intra-company transfer' },
          { type: 'proof_of_address', displayName: 'Proof of Address', required: true, description: 'Accommodation in France' }
        ]
      }
    ]
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    visaTypes: [
      {
        code: 'KNOWLEDGE_MIGRANT',
        name: 'Knowledge Migrant Permit',
        description: 'For highly skilled migrants sponsored by a recognised employer',
        minSalary: 5688,
        currency: 'EUR',
        processingTime: '2 weeks to 3 months',
        validityPeriod: 'Up to 5 years',
        requiredDocuments: [
          { type: 'passport', displayName: 'Valid Travel Document', required: true, description: 'Valid passport' },
          { type: 'antecedents_certificate', displayName: 'Antecedents Certificate', required: true, description: 'Completed and signed certificate of criminal history' },
          { type: 'tb_test', displayName: 'TB Medical Test', required: true, description: 'Tuberculosis test unless exempt' },
          { type: 'employment_contract', displayName: 'Employment Contract', required: true, description: 'Contract or appointment decision' },
          { type: 'academic_certificates', displayName: 'Educational Documents', required: true, description: 'Diplomas, transcripts with sworn translations' },
          { type: 'reference_letters', displayName: 'Reference Letters', required: false, description: 'Professional references' }
        ]
      }
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    visaTypes: [
      {
        code: 'EU_BLUE_CARD',
        name: 'EU Blue Card',
        description: 'For highly qualified professionals with university degree',
        minSalary: 48300,
        currency: 'EUR',
        processingTime: '1-3 months',
        validityPeriod: 'Up to 4 years',
        requiredDocuments: [
          { type: 'application_form', displayName: 'Application Form', required: true, description: 'Completed and signed twice' },
          { type: 'passport', displayName: 'Valid Passport', required: true, description: 'Valid for 15+ months, undamaged, with 2 blank pages' },
          { type: 'photographs', displayName: 'Passport-sized Photographs', required: true, description: 'Recent biometric photos' },
          { type: 'employment_contract', displayName: 'Work Contract', required: true, description: 'Employment agreement or job offer' },
          { type: 'employment_declaration', displayName: 'Statement of Employment Relations', required: true, description: 'Filled by prospective employer' },
          { type: 'academic_certificates', displayName: 'Degree Document', required: true, description: 'Proof of completed higher education' },
          { type: 'health_insurance', displayName: 'Health Insurance', required: true, description: 'German statutory or comparable private insurance' }
        ]
      },
      {
        code: 'ICT_PERMIT',
        name: 'ICT Permit',
        description: 'For intra-corporate transferees',
        processingTime: '1-3 months',
        validityPeriod: 'Up to 3 years',
        requiredDocuments: [
          { type: 'application_form', displayName: 'Application Form', required: true, description: 'Completed visa application' },
          { type: 'passport', displayName: 'Valid Passport', required: true, description: 'Valid travel document' },
          { type: 'photographs', displayName: 'Photographs', required: true, description: 'Biometric passport photos' },
          { type: 'transfer_documents', displayName: 'Transfer Documents', required: true, description: 'Proving intra-company transfer' },
          { type: 'employment_contract', displayName: 'Employment Contract', required: true, description: 'From German entity' },
          { type: 'health_insurance', displayName: 'Health Insurance', required: true, description: 'German health insurance coverage' }
        ]
      }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    visaTypes: [
      {
        code: 'O1A',
        name: 'O-1A Visa',
        description: 'For individuals with extraordinary ability in sciences, education, business, or athletics',
        processingTime: '2-3 months (15 days with premium)',
        validityPeriod: 'Up to 3 years',
        requiredDocuments: [
          { type: 'passport', displayName: 'Valid Passport', required: true, description: 'Valid for at least 6 months' },
          { type: 'resume', displayName: 'Detailed CV', required: true, description: 'Comprehensive curriculum vitae' },
          { type: 'personal_statement', displayName: 'Personal Statement', required: true, description: 'Statement of achievements and contributions' },
          { type: 'recommendation_letters', displayName: 'Recommendation Letters', required: true, description: 'From recognized experts in the field' },
          { type: 'awards_recognition', displayName: 'Awards and Recognition', required: true, description: 'Evidence of nationally or internationally recognized prizes' },
          { type: 'media_coverage', displayName: 'Media Coverage', required: false, description: 'Published material about you' },
          { type: 'membership_proof', displayName: 'Membership Proof', required: false, description: 'Membership in associations requiring outstanding achievements' }
        ]
      },
      {
        code: 'O1B',
        name: 'O-1B Visa',
        description: 'For individuals with extraordinary ability in arts, motion picture, or television',
        processingTime: '2-3 months (15 days with premium)',
        validityPeriod: 'Up to 3 years',
        requiredDocuments: [
          { type: 'passport', displayName: 'Valid Passport', required: true, description: 'Valid for at least 6 months' },
          { type: 'resume', displayName: 'Detailed CV', required: true, description: 'Showing artistic achievements' },
          { type: 'personal_statement', displayName: 'Personal Statement', required: true, description: 'Describing extraordinary ability' },
          { type: 'recommendation_letters', displayName: 'Recommendation Letters', required: true, description: 'From recognized experts in the field' },
          { type: 'portfolio', displayName: 'Portfolio', required: true, description: 'Samples of work, publications, performances' },
          { type: 'awards_recognition', displayName: 'Awards and Recognition', required: false, description: 'Evidence of recognition for achievements' },
          { type: 'media_coverage', displayName: 'Media Coverage', required: false, description: 'Reviews or articles about your work' }
        ]
      },
      {
        code: 'H1B',
        name: 'H-1B Visa',
        description: 'For workers in specialty occupations requiring theoretical or technical expertise',
        processingTime: '3-6 months',
        validityPeriod: '3 years (extendable to 6)',
        requiredDocuments: [
          { type: 'passport', displayName: 'Valid Passport', required: true, description: 'Valid for at least 6 months' },
          { type: 'resume', displayName: 'Detailed CV', required: true, description: 'Professional resume' },
          { type: 'academic_certificates', displayName: 'Educational Credentials', required: true, description: 'Bachelor\'s degree or equivalent' },
          { type: 'employment_contract', displayName: 'Job Offer Letter', required: true, description: 'From US employer' },
          { type: 'labor_condition_application', displayName: 'Labor Condition Application', required: true, description: 'Approved LCA from employer' },
          { type: 'work_experience', displayName: 'Work Experience Letters', required: false, description: 'Proving relevant experience' }
        ]
      }
    ]
  }
];

// Helper function to get all countries
export const getAllCountries = (): Country[] => {
  return VISA_CONFIG;
};

// Helper function to get country by code
export const getCountryByCode = (code: string): Country | undefined => {
  return VISA_CONFIG.find(country => country.code === code);
};

// Helper function to get visa types for a country
export const getVisaTypesByCountry = (countryCode: string): VisaType[] => {
  const country = getCountryByCode(countryCode);
  return country ? country.visaTypes : [];
};

// Helper function to get specific visa type
export const getVisaType = (countryCode: string, visaCode: string): VisaType | undefined => {
  const visaTypes = getVisaTypesByCountry(countryCode);
  return visaTypes.find(visa => visa.code === visaCode);
};
