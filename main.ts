import Denomander from "https://deno.land/x/denomander/mod.ts";
import { demauro } from "./lib/demauro.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const program = new Denomander({
    app_name: "big-dict",
    app_description: "Queries all the dictionaries with a single command",
    app_version: "0.1.0",
  });

  program
    .command("query [expression]", "Start a query")
    .action(async ({ expression }: { expression: string }) => {
      const results = await demauro(expression);
      console.log(JSON.stringify(results, null, 2));
    })
    .option("-p --poly", "Include polyrhematic results")
    .parse(Deno.args);
}
