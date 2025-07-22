import { lmStudioClient } from './lm-studio-client.js'

class ConnectionStatus {
  constructor() {
    this.isVisible = false
    this.statusElement = null
    this.checkInterval = null
    this.autoHideTimeout = null
  }

  init() {
    this.createStatusElement()
    this.startPeriodicCheck()
  }

  createStatusElement() {
    if (this.statusElement) return

    this.statusElement = document.createElement('div')
    this.statusElement.className = 'lm-studio-status'
    this.statusElement.innerHTML = `
      <div class="lm-studio-status__content">
        <div class="lm-studio-status__icon">🤖</div>
        <div class="lm-studio-status__text">Проверяем LM Studio...</div>
      </div>
    `

    this.addStyles()

    document.body.appendChild(this.statusElement)
  }

  addStyles() {
    if (document.getElementById('lm-studio-status-styles')) return

    const styles = document.createElement('style')
    styles.id = 'lm-studio-status-styles'
    styles.innerHTML = `
      .lm-studio-status {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 1050;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 300px;
        font-size: 14px;
      }

      .lm-studio-status--visible {
        transform: translateX(0);
        opacity: 1;
      }

      .lm-studio-status--connected {
        background: linear-gradient(135deg, #d4edda, #c3e6cb);
        border-color: #28a745;
        color: #155724;
      }

      .lm-studio-status--disconnected {
        background: linear-gradient(135deg, #f8d7da, #f5c6cb);
        border-color: #dc3545;
        color: #721c24;
      }

      .lm-studio-status--checking {
        background: linear-gradient(135deg, #fff3cd, #ffeaa7);
        border-color: #ffc107;
        color: #856404;
      }

      .lm-studio-status__content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .lm-studio-status__icon {
        font-size: 16px;
        animation: pulse 2s infinite;
      }

      .lm-studio-status--connected .lm-studio-status__icon {
        animation: none;
      }

      .lm-studio-status__text {
        font-weight: 500;
        line-height: 1.2;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      @media (max-width: 768px) {
        .lm-studio-status {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
          font-size: 13px;
        }
      }
    `

    document.head.appendChild(styles)
  }

  async show(autoHide = true) {
    if (!this.statusElement) this.init()

    this.isVisible = true
    this.statusElement.classList.add('lm-studio-status--visible')

    await this.updateStatus()

    if (autoHide) {
      this.scheduleAutoHide()
    }
  }

  hide() {
    if (!this.statusElement) return

    this.isVisible = false
    this.statusElement.classList.remove('lm-studio-status--visible')

    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout)
      this.autoHideTimeout = null
    }
  }

  async updateStatus() {
    if (!this.statusElement) return

    this.setStatus('checking', '🔄', 'Проверяем LM Studio...')

    try {
      const status = await lmStudioClient.checkConnection()

      if (status.connected) {
        this.setStatus('connected', '✅', `Подключен к ${status.model}`)
      } else {
        this.setStatus('disconnected', '❌', 'LM Studio недоступен')
      }
    } catch {
      this.setStatus('disconnected', '❌', 'Ошибка подключения')
    }
  }

  setStatus(type, icon, text) {
    if (!this.statusElement) return

    this.statusElement.classList.remove(
      'lm-studio-status--connected',
      'lm-studio-status--disconnected',
      'lm-studio-status--checking'
    )

    this.statusElement.classList.add(`lm-studio-status--${type}`)

    const iconElement = this.statusElement.querySelector('.lm-studio-status__icon')
    const textElement = this.statusElement.querySelector('.lm-studio-status__text')

    if (iconElement) iconElement.textContent = icon
    if (textElement) textElement.textContent = text
  }

  scheduleAutoHide() {
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout)
    }

    this.autoHideTimeout = setTimeout(() => {
      this.hide()
    }, 5000)
  }

  startPeriodicCheck() {
    if (this.checkInterval) return

    this.checkInterval = setInterval(async () => {
      if (!this.isVisible) {
        await lmStudioClient.ensureConnection()
      }
    }, 120000)
  }

  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  destroy() {
    this.stopPeriodicCheck()
    this.hide()

    if (this.statusElement) {
      this.statusElement.remove()
      this.statusElement = null
    }
  }
}

export const connectionStatus = new ConnectionStatus()
export default ConnectionStatus 