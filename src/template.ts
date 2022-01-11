import Handlebars from "handlebars";

export function setupTemplateHelper() {
  Handlebars.registerHelper(
    "renumber",
    function (num1: string, num2: number, padding: number | unknown) {
      const pad = typeof padding == "number" ? padding : 2;
      return (Number(num1) - num2).toString().padStart(pad, "0");
    }
  );
}
