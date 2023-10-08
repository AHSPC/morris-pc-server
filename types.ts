import { Item } from "./dbinterface"

interface ComputerData extends Item {
  id: string;
  name: string;
  token: string;
}

interface Log extends Item {
  computerId: string;
  time: number;
  type: "error" | "warning" | "normal";
  message: string;
}

interface Task extends Item {
  id: string;
  computerId: string;
  name: string;
  command: string;
  details: string;
}

interface Config extends Item {
  url: string;
  fallbackURL: string;
  checkInterval: number;
}

export {
  ComputerData,
  Log,
  Task,
  Config,
}
