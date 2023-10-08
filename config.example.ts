import { DBInterface } from "./dbinterface"
import { ComputerData, Config, Task } from "./types"

const config = {
  // admin username is "admin"
  admin_pass: "<admin_pass>",
  port: 8080,
  token: "<token>",
  url: "<url>",
  fallbackURL: "<url>",
  checkInterval: 100,
}

export { config, addComputersToDB, loadConfigIntoDB, ensureTasksTableExists }

function addComputersToDB(ids_start: number = 1, ids_end: number = 35) {
  const db = new DBInterface("data.sqlite")
  const computers = db.openTable<ComputerData>("computers")

  if (computers.tableExists) computers.del({})

  for (let i = ids_start; i <= ids_start + ids_end; i++) {
    computers.add({
      id: "0".repeat(4 - i.toString().length) + i.toString(),
      name: `computer-${i}`,
      token: config.token,
    })
  }
}

function loadConfigIntoDB() {
  const db = new DBInterface("data.sqlite")
  const configDB = db.openTable<Config>("config")

  if (configDB.tableExists) configDB.del({})

  configDB.add({ url: config.url, fallbackURL: config.fallbackURL, checkInterval: config.checkInterval })
}

function ensureTasksTableExists() {
  const db = new DBInterface("data.sqlite")
  const tasksDB = db.openTable<Task>("tasks")

  tasksDB.createTable({
    id: "",
    computerId: "",
    name: "",
    command: "",
    details: "",
  })
}
