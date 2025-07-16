export class DashboardDTO {
  constructor({ id, name, owner_username, created_at, description, charts_count }) {
    this.id = id
    this.name = name
    this.owner_username = owner_username
    this.created_at = created_at
    this.description = description
    this.charts_count = charts_count
  }
} 