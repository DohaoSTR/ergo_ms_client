import { apiClient } from '../manager'
import { endpoints } from '../endpoints'

export const bioService = {
  // Species methods
  async getSpecies(params = {}) {
    return await apiClient.get(endpoints.bio.species, params)
  },

  async getSpeciesById(id) {
    return await apiClient.get(endpoints.bio.speciesDetail(id))
  },

  async createSpecies(speciesData) {
    return await apiClient.post(endpoints.bio.species, speciesData)
  },

  async updateSpecies(id, speciesData) {
    return await apiClient.put(endpoints.bio.speciesDetail(id), speciesData)
  },

  async patchSpecies(id, speciesData) {
    return await apiClient.patch(endpoints.bio.speciesDetail(id), speciesData)
  },

  async deleteSpecies(id) {
    return await apiClient.delete(endpoints.bio.speciesDetail(id))
  },

  // Sites methods
  async getSites(params = {}) {
    return await apiClient.get(endpoints.bio.sites, params)
  },

  async createSite(siteData) {
    return await apiClient.post(endpoints.bio.sites, siteData)
  },

  async getSiteById(id) {
    return await apiClient.get(endpoints.bio.siteById(id))
  },

  async updateSiteById(id, siteData) {
    return await apiClient.put(endpoints.bio.siteById(id), siteData)
  },

  async patchSiteById(id, siteData) {
    return await apiClient.patch(endpoints.bio.siteById(id), siteData)
  },

  async deleteSiteById(id) {
    return await apiClient.delete(endpoints.bio.siteById(id))
  },

  async getSiteDetails(siteNumber, zoneType) {
    return await apiClient.get(endpoints.bio.siteDetail(siteNumber, zoneType))
  },

  async updateSite(siteNumber, zoneType, siteData) {
    return await apiClient.put(endpoints.bio.siteDetail(siteNumber, zoneType), siteData)
  },

  async patchSite(siteNumber, zoneType, siteData) {
    return await apiClient.patch(endpoints.bio.siteDetail(siteNumber, zoneType), siteData)
  },

  async deleteSite(siteNumber, zoneType) {
    return await apiClient.delete(endpoints.bio.siteDetail(siteNumber, zoneType))
  },

  async deleteMultipleSites(siteIds) {
    return await apiClient.post(endpoints.bio.bulkDeleteSites, { ids: siteIds })
  },

  // Descriptions methods
  async getDescriptions(siteNumber, zoneType) {
    return await apiClient.get(endpoints.bio.descriptions(siteNumber, zoneType))
  },

  async createDescriptions(siteNumber, zoneType, descriptionsData) {
    return await apiClient.post(endpoints.bio.descriptions(siteNumber, zoneType), descriptionsData)
  },

  async updateDescriptions(siteNumber, zoneType, descriptionsData) {
    return await apiClient.put(endpoints.bio.descriptions(siteNumber, zoneType), descriptionsData)
  },

  async patchDescriptions(siteNumber, zoneType, descriptionsData) {
    return await apiClient.patch(endpoints.bio.descriptions(siteNumber, zoneType), descriptionsData)
  },

  async deleteDescriptions(siteNumber, zoneType) {
    return await apiClient.delete(endpoints.bio.descriptions(siteNumber, zoneType))
  },

  async deleteDescription(descriptionId) {
    return await apiClient.delete(endpoints.bio.descriptionDetail(descriptionId))
  },

  async deleteMultipleDescriptions(descriptionIds) {
    return await apiClient.post(endpoints.bio.bulkDeleteDescriptions, { ids: descriptionIds })
  },

  // Analysis methods
  async getSiteMeans(siteNumber, zoneType, scaleType) {
    return await apiClient.get(endpoints.bio.siteMeans(siteNumber, zoneType), {
      scale_type: scaleType,
    })
  },

  async getCustomSiteMeans(customData, scaleType) {
    return await apiClient.post(endpoints.bio.customSiteMeans, {
      custom_data: customData,
      scale_type: scaleType,
    })
  },

  async getSiteDistribution(siteNumber, zoneType, spectrumType) {
    return await apiClient.get(endpoints.bio.siteDistribution(siteNumber, zoneType), {
      spectrum_type: spectrumType,
    })
  },

  async getCustomSiteDistribution(customData, spectrumType) {
    return await apiClient.post(endpoints.bio.customSiteDistribution, {
      custom_data: customData,
      spectrum_type: spectrumType,
    })
  },

  async getSiteClassification(siteNumber, zoneType) {
    return await apiClient.get(endpoints.bio.siteClassification(siteNumber, zoneType))
  },

  async getCustomSiteClassification(customData) {
    return await apiClient.post(endpoints.bio.customSiteClassification, {
      custom_data: customData,
    })
  },

  async getSiteComparison(siteIds, elements) {
    return await apiClient.post(endpoints.bio.siteComparison, {
      site_ids: siteIds,
      elements: elements,
    })
  },

  async getCustomAnalysis(customData, elements) {
    return await apiClient.post(endpoints.bio.customAnalysis, {
      custom_data: customData,
      elements: elements,
    })
  },
}
