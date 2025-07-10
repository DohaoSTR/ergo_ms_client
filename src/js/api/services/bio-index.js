import { bioService } from '@/js/api/services/bio'

// Species methods
export const getSpecies = bioService.getSpecies
export const getSpeciesById = bioService.getSpeciesById
export const createSpecies = bioService.createSpecies
export const updateSpecies = bioService.updateSpecies
export const patchSpecies = bioService.patchSpecies
export const deleteSpecies = bioService.deleteSpecies

// Sites methods
export const getSites = bioService.getSites
export const createSite = bioService.createSite
export const getSiteById = bioService.getSiteById
export const updateSiteById = bioService.updateSiteById
export const patchSiteById = bioService.patchSiteById
export const deleteSiteById = bioService.deleteSiteById
export const getSiteDetails = bioService.getSiteDetails
export const updateSite = bioService.updateSite
export const patchSite = bioService.patchSite
export const deleteSite = bioService.deleteSite
export const deleteMultipleSites = bioService.deleteMultipleSites

// Descriptions methods
export const getDescriptions = bioService.getDescriptions
export const createDescriptions = bioService.createDescriptions
export const updateDescriptions = bioService.updateDescriptions
export const patchDescriptions = bioService.patchDescriptions
export const deleteDescriptions = bioService.deleteDescriptions
export const deleteDescription = bioService.deleteDescription
export const deleteMultipleDescriptions = bioService.deleteMultipleDescriptions

// Analysis methods
export const getSiteMeans = bioService.getSiteMeans
export const getCustomSiteMeans = bioService.getCustomSiteMeans
export const getSiteDistribution = bioService.getSiteDistribution
export const getCustomSiteDistribution = bioService.getCustomSiteDistribution
export const getSiteClassification = bioService.getSiteClassification
export const getCustomSiteClassification = bioService.getCustomSiteClassification
export const getSiteComparison = bioService.getSiteComparison
export const getCustomAnalysis = bioService.getCustomAnalysis
