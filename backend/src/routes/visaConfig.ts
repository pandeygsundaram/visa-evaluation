import { Router } from 'express';
import {
  getCountriesAndVisaTypes,
  getCountryVisaTypes,
  getSpecificVisaType
} from '../controllers/visaConfigController';

const router = Router();

// Public routes - no authentication required
router.get('/', getCountriesAndVisaTypes);
router.get('/:countryCode', getCountryVisaTypes);
router.get('/:countryCode/:visaCode', getSpecificVisaType);

export default router;
