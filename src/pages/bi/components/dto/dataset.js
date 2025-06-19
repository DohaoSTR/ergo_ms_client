export class DatasetDTO {
    constructor({ id, name, owner_username, created_at, storage_type }) {
      this.id = id
      this.name = name
      this.owner_username = owner_username
      this.created_at = created_at
    }
  }
