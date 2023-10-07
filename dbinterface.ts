// DBInterface Alpha 0.1 by blobbybilb (from 6.Oct.2023)

import { Database } from "bun:sqlite"

// type validTypes = string | number | boolean | null
type validTypes = string | number
export type Item = Record<string, validTypes>
type query<T> =
  { [K in keyof T as string extends K ? never : K]: T[K] }
// [P in keyof query<T>]?: ((arg: query<T>[P]) => boolean) <--- this goes as the parameter type

export class DBInterface {
  dbPath: string
  db: Database

  constructor(path: string | undefined = undefined) {
    this.dbPath = path ?? ":memory:"
    this.db = new Database(this.dbPath, { create: true })
  }

  openTable<T extends Item>(table: string): DBTable<T> {
    return new DBTable<T>(this.db, table)
  }

  listTables(): string[] {
    return this.db.query("SELECT name FROM sqlite_master WHERE type='table'").all().map((e: any) => e.name) as string[]
  }

  deleteTable(table: string) {
    this.db.query(`DROP TABLE ${table}`).run()
  }
}


class DBTable<T extends Item> {
  db: Database
  table: string
  // itemType: T | undefined
  tableExists: boolean

  constructor(db: Database, table: string) {
    this.db = db
    this.table = table
    this.tableExists = this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table) ? true : false
  }

  getSQLType(value: validTypes): string {
    if (typeof value === "string") {
      return "TEXT"
    } if (typeof value === "number") {
      return "REAL"
    } if (typeof value === "boolean") {
      return "INTEGER"
    } if (value === null) {
      return "NULL"
    }
    else {
      throw new Error("Invalid type")
    }
  }

  getRowType(item: Item): string[] {
    return Object.entries(item).map(([_, value]) => this.getSQLType(value))
  }

  createTable(item: T) {
    const rowType = this.getRowType(item)
    const rowNamesString = Object.keys(item).map((name, index) => `${name} ${rowType[index]}`).join(", ")
    this.db.query(`CREATE TABLE IF NOT EXISTS ${this.table} (${rowNamesString})`).run()
    this.tableExists = true
  }

  add(item: T) {
    if (!this.tableExists) this.createTable(item)

    const rowNames = Object.keys(item)
    const rowValuesString = Object.values(item).map((value) => typeof value === "string" ? `'${value}'` : value).join(", ")
    const rowNamesString = rowNames.join(", ")
    this.db.query(`INSERT INTO ${this.table} (${rowNamesString}) VALUES (${rowValuesString})`).run()
  }

  get(query: { [P in keyof query<T>]?: ((arg: query<T>[P]) => boolean) | T[P] }): T[] {
    let queryResult: T[]

    if ((Object.values(query).filter((value) => typeof value !== "function") as validTypes[]).length === 0) {
      queryResult = this.db.query(`SELECT * FROM ${this.table}`).all() as T[]
    } else {
      const queryKeys = Object.entries(query)
        .filter(([_, value]) => typeof value !== "function")
        .map(([key, _]) => `${key}`)
      const queryValuesString = Object.values(query)
        .filter((value) => typeof value !== "function")
        .map((value) => typeof value === "string" ? `'${value}'` : value).join(", ")

      const queryKeysString = queryKeys.join(", ")
      queryResult = this.db.query(`SELECT * FROM ${this.table} WHERE (${queryKeysString}) = (${queryValuesString})`).all() as T[]
    }

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "function") {
        queryResult = queryResult.filter((item) => value(item[key]))
      }
    }

    return queryResult
  }

  del(item: Item) {
    const queryKeys = Object.keys(item)
    const queryValuesString = Object.values(item).map((value) => typeof value === "string" ? `'${value}'` : value).join(", ")

    const queryKeysString = queryKeys.join(", ")
    this.db.query(`DELETE FROM ${this.table} WHERE ${queryKeysString} = (${queryValuesString})`).run()
  }

  update(item: Item, newItem: T) {
    this.del(item)
    this.add(newItem)
  }
}
