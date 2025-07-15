export class ConnectionDTO {
  constructor({ id, name, connector_type_display, created_at, config, owner }) {
    this.id = id
    this.name = name || '—'
    this.connector_type_display = connector_type_display || '—'
    this.created_at = created_at
    this.config = config
    this.owner = owner
    this.type = 'connection'
  }
} 