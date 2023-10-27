import { Hono } from "hono";
import { DBInterface } from "./dbinterface";
import { ComputerData, Log, Task, Config } from "./types";
import {
  config,
  addComputersToDB,
  loadConfigIntoDB,
  ensureTasksTableExists,
} from "./config";
import { basicAuth } from "hono/basic-auth";
import dashboard from "./dashboard";
import { serveStatic } from "hono/bun";

const server = new Hono();

addComputersToDB();
loadConfigIntoDB();
ensureTasksTableExists();

const db = new DBInterface("data.sqlite");

const computersDB = db.openTable<ComputerData>("computers");
const logsDB = db.openTable<Log>("logs");
const tasksDB = db.openTable<Task>("tasks");
const configDB = db.openTable<Config>("config");

function log(message: string) {
  logsDB.add({
    computerId: "server",
    message: message,
    time: Date.now(),
    type: "normal",
  });
}

log("Server started, computers added to DB, and tables prepared.");

server.all("/pcs/exists/*", (c) => c.text("exists -- AHS Room 310 PC Manager"));
server.all("/exists", (c) => c.text("exists -- AHS Room 310 PC Manager"));

server.get("/", (c) => c.redirect("/admin/dashboard"));

server.use(
  "/admin/*",
  basicAuth({ username: "admin", password: config.admin_pass }),
);
server.get("/admin/dashboard", (c) => {
  const computerNames = computersDB.get({}).map((e) => `${e.name} - ${e.id}`);
  const tasksInfo = tasksDB
    .get({})
    .map((e) => ({
      computer: e.computerId,
      command: e.command,
      details: e.details,
    }));
  const logs = logsDB
    .get({})
    .reverse()
    .map((e) => ({
      computerId: e.computerId,
      time: new Date(e.time).toLocaleString() as any, // quick hack to make TS not error because type changed (could just move this to template)
      type: e.type,
      message: e.message,
    }));
  const config = configDB.get({})[0];

  return c.html(
    dashboard(
      tasksInfo,
      computerNames,
      logs,
      config.url,
      config.fallbackURL,
      config.checkInterval,
    ),
  );
});
server.post("/admin/run", async (c) => {
  // get post form data from text input with name "command"
  const body = await c.req.parseBody();
  const command = body["command"] as string;

  const computers = computersDB.get({});

  const id = Math.random().toString();
  computers.forEach((e) => {
    tasksDB.add({
      id: id,
      computerId: e.id,
      name: "(task names are not implemented yet)",
      command: command,
      details: "",
    });
  });

  return c.text("Task Added!");
});

server.get("/admin/logout", (c) => {
  c.status(401);
  return c.text("Logged out!");
});

server.use("/pcs/*", async (c, next) => {
  const token = ((await c.req.json()) as unknown as { token?: string }).token;
  if (token === undefined) {
    return c.text("no token");
  }
  if (computersDB.get({ token }).length === 0) {
    return c.text("invalid token");
  }
  await next();
});

server.post("/pcs/get-config/:pcid", (c) => {
  const pcid = c.req.param("pcid");
  const computerData = computersDB.get({ id: pcid })[0];
  const generalConfig = configDB.get({})[0];

  if (computerData === undefined) {
    return c.text("no computer");
  }

  const config = { ...computerData, ...generalConfig };

  return c.json(config);
});

server.post("/pcs/get-actions/:pcid", (c) => {
  const pcid = c.req.param("pcid");
  const computer = computersDB.get({ id: pcid })[0];

  if (computer === undefined) {
    return c.text("no computer");
  }

  const tasks = tasksDB.get({ computerId: pcid });

  const tasksObject: Record<string, string> = {};
  for (let item of tasks) {
    tasksObject[item.id] = item.command;
  }

  return c.json(tasksObject);
});

server.post("/pcs/get-update", serveStatic({ path: "./room310pcmanager.exe" }));

server.post("/pcs/mark-completed/:pcid", async (c) => {
  const pcid = c.req.param("pcid");
  const computer = computersDB.get({ id: pcid })[0];
  if (computer === undefined) {
    return c.text("no computer");
  }

  const taskId = ((await c.req.json()) as unknown as { task_id?: string })
    .task_id;
  if (taskId === undefined) {
    return c.text("no task id");
  }

  const task = tasksDB.get({ id: taskId, computerId: pcid })[0];
  if (task === undefined) {
    return c.text("no task for computer with id");
  }

  tasksDB.del({ id: taskId, computerId: pcid });
  logsDB.add({
    computerId: `server (for ${pcid})`,
    type: "normal",
    message: `${pcid} completed task ${task}`,
    time: Date.now(),
  });

  return c.text("done");
});

server.post("/pcs/mark-failed/:pcid", async (c) => {
  const pcid = c.req.param("pcid");
  const computer = computersDB.get({ id: pcid })[0];
  if (computer === undefined) {
    return c.text("no computer");
  }

  const taskId = ((await c.req.json()) as unknown as { task_id?: string })
    .task_id;
  if (taskId === undefined) {
    return c.text("no task id");
  }

  const task = tasksDB.get({ id: taskId, computerId: pcid })[0];
  if (task === undefined) {
    return c.text("no task for computer with id");
  }

  const info = ((await c.req.json()) as unknown as { info?: string }).info;
  if (info === undefined) {
    return c.text("no info");
  }

  const oldDetails = tasksDB.get({ id: taskId, computerId: pcid })[0].details;
  const newDetails = `${oldDetails}${
    oldDetails !== "" ? "\n<br>\n" : ""
  }FAILED (${new Date().toLocaleString()}): ${info}`;

  tasksDB.update({ id: taskId, computerId: pcid }, { details: newDetails });

  console.log(newDetails);

  return c.text("done");
});

server.post("/pcs/log/:pcid", async (c) => {
  const pcid = c.req.param("pcid");
  const computer = computersDB.get({ id: pcid })[0];
  if (computer === undefined) {
    return c.text("no computer");
  }

  const type = (
    (await c.req.json()) as unknown as { type?: "error" | "warning" | "normal" }
  ).type;
  if (type === undefined) {
    return c.text("no type");
  }

  const message = ((await c.req.json()) as unknown as { message?: string })
    .message;
  if (message === undefined) {
    return c.text("no message");
  }

  logsDB.add({ computerId: pcid, time: Date.now(), type, message });

  return c.text("done");
});

const computers = computersDB.get({}); // id name token
const generalConfig = configDB.get({})[0]; // checkInterval fallbackURL url
const initialConfigs = computers
  .map((e) => ({ ...generalConfig, ...e }))
  .reverse();

server.all("/init-get-config", async (c) => c.json(initialConfigs.pop()));

export default server;
