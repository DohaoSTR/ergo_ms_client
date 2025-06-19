import menuConfig from '@/config/menu-config.json'

export class AdaptiveSeparators {
  constructor(config = menuConfig) {
    this.config = config
    this.separatorSettings = config.separatorSettings || {}
    this.separators = config.separators || {}
  }

  getOrderBasedSeparators() {
    if (!this.separators.byOrderIndex) {
      return {}
    }

    const result = {}
    Object.entries(this.separators.byOrderIndex).forEach(([key, value]) => {
      const index = parseInt(key)
      if (index >= 0) {
        result[index] = value
      }
    })

    return result
  }

  generateAdaptiveSeparators() {
    const result = {}
    if (this.separatorSettings.useOrderBased && this.separators.byOrderIndex) {
      Object.assign(result, this.getOrderBasedSeparators())
    }
    return result
  }

  getSeparatorAt(index) {
    const separators = this.generateAdaptiveSeparators()
    return separators[index] || null
  }

  shouldShowSeparator(index) {
    return this.getSeparatorAt(index) !== null
  }
}

export default AdaptiveSeparators 