import { ui } from "./ui";

export async function showErrorAndExit(msg: string) {
  ui.updateBottomBar(msg);
  await new Promise((resolve) => setTimeout(resolve, 20000));
  process.exit(1);
}
