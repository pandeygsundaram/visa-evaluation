import { Request, Response } from 'express';
import {
  getAllCountries,
  getCountryByCode,
  getVisaTypesByCountry,
  getVisaType
} from '../config/visaData';

// @desc    Get all countries with their visa types
// @route   GET /api/visa-config
// @access  Public
export const getCountriesAndVisaTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const countries = getAllCountries();

    // Format response
    const formattedData = countries.map(country => ({
      code: country.code,
      name: country.name,
      flag: country.flag,
      visaTypes: country.visaTypes.map(visa => ({
        code: visa.code,
        name: visa.name,
        description: visa.description,
        minSalary: visa.minSalary,
        currency: visa.currency,
        processingTime: visa.processingTime,
        validityPeriod: visa.validityPeriod,
        requiredDocumentTypes: visa.requiredDocuments.map(doc => doc.type),
        requiredDocuments: visa.requiredDocuments
      }))
    }));

    res.status(200).json({
      success: true,
      data: {
        countries: formattedData,
        totalCountries: formattedData.length,
        totalVisaTypes: formattedData.reduce((sum, country) => sum + country.visaTypes.length, 0)
      }
    });
  } catch (error: any) {
    console.error('Get countries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching countries and visa types',
      error: error.message
    });
  }
};

// @desc    Get visa types for a specific country
// @route   GET /api/visa-config/:countryCode
// @access  Public
export const getCountryVisaTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { countryCode } = req.params;

    const country = getCountryByCode(countryCode.toUpperCase());

    if (!country) {
      res.status(404).json({
        success: false,
        message: `Country with code '${countryCode}' not found`
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        country: {
          code: country.code,
          name: country.name,
          flag: country.flag,
          visaTypes: country.visaTypes.map(visa => ({
            code: visa.code,
            name: visa.name,
            description: visa.description,
            minSalary: visa.minSalary,
            currency: visa.currency,
            processingTime: visa.processingTime,
            validityPeriod: visa.validityPeriod,
            requiredDocuments: visa.requiredDocuments
          }))
        }
      }
    });
  } catch (error: any) {
    console.error('Get country visa types error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visa types for country',
      error: error.message
    });
  }
};

// @desc    Get specific visa type details
// @route   GET /api/visa-config/:countryCode/:visaCode
// @access  Public
export const getSpecificVisaType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { countryCode, visaCode } = req.params;

    const visaType = getVisaType(countryCode.toUpperCase(), visaCode.toUpperCase());

    if (!visaType) {
      res.status(404).json({
        success: false,
        message: `Visa type '${visaCode}' not found for country '${countryCode}'`
      });
      return;
    }

    const country = getCountryByCode(countryCode.toUpperCase());

    res.status(200).json({
      success: true,
      data: {
        country: {
          code: country?.code,
          name: country?.name,
          flag: country?.flag
        },
        visaType: {
          code: visaType.code,
          name: visaType.name,
          description: visaType.description,
          minSalary: visaType.minSalary,
          currency: visaType.currency,
          processingTime: visaType.processingTime,
          validityPeriod: visaType.validityPeriod,
          requiredDocuments: visaType.requiredDocuments
        }
      }
    });
  } catch (error: any) {
    console.error('Get specific visa type error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visa type details',
      error: error.message
    });
  }
};
