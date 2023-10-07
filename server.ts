import { Hono } from 'hono'
import { DBInterface } from './dbinterface'
import { ComputerData, Log, Task, Config } from './types'

const server = new Hono()
const db = new DBInterface("data.sqlite")

const computersDB = db.openTable<ComputerData>("computers")
const logsDB = db.openTable<Log>("logs")
const tasksDB = db.openTable<Task>("tasks")
const configDB = db.openTable<Config>("config")

server.get("/exists", c => c.text("exists"))

server.get("/")

server.use("/api", async (c, next) => {
  const token = (c.req.json() as unknown as { token?: string }).token

  if (token === undefined) { return c.text("no token") }

  if (computersDB.get({ token }).length === 0) { return c.text("invalid token") }

  await next()
})

server.post("/api/get-config/:pcid", (c) => {
  const pcid = c.req.param("pcid")
  const computerData = computersDB.get({ id: pcid })[0]
  const generalConfig = configDB.get({})[0]

  if (computerData === undefined) { return c.text("no computer") }

  const config = { ...computerData, ...generalConfig }

  return c.json(config)
})

server.post("/api/get-actions/:pcid", (c) => {
  const pcid = c.req.param("pcid")
  const computer = computersDB.get({ id: pcid })[0]

  if (computer === undefined) { return c.text("no computer") }

  const tasks = tasksDB.get({ computerId: pcid })
    .map(task => ({ [task.id]: task.command }))

  return c.json(tasks)
})

server.post("/api/get-update", (c) => {
  return c.text("no update")
})

server.post("/api/mark-completed/:pcid", (c) => {
  const pcid = c.req.param("pcid")
  const computer = computersDB.get({ id: pcid })[0]
  if (computer === undefined) { return c.text("no computer") }

  const taskId = (c.req.json() as unknown as { task_id?: string }).task_id
  if (taskId === undefined) { return c.text("no task id") }
  if (tasksDB.get({ id: taskId!, computerId: pcid })) { return c.text("no task for computer with id") }

  const task = tasksDB.get({ id: taskId, computerId: pcid })[0]
  if (task === undefined) { return c.text("no task") }

  tasksDB.del({ id: taskId, computerId: pcid })

  return c.text("done")
})

server.post("/api/mark-failed/:pcid", (c) => {
  const pcid = c.req.param("pcid")
  const computer = computersDB.get({ id: pcid })[0]
  if (computer === undefined) { return c.text("no computer") }

  const taskId = (c.req.json() as unknown as { task_id?: string }).task_id
  if (taskId === undefined) { return c.text("no task id") }
  if (tasksDB.get({ id: taskId!, computerId: pcid })) { return c.text("no task for computer with id") }

  const task = tasksDB.get({ id: taskId, computerId: pcid })[0]
  if (task === undefined) { return c.text("no task") }

  const info = (c.req.json() as unknown as { info?: string }).info
  if (info === undefined) { return c.text("no info") }

  tasksDB.update({ id: taskId, computerId: pcid }, { details: info })
})


export default server
