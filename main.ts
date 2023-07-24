import Denomander, { Option } from "https://deno.land/x/denomander/mod.ts";
import * as Colors from "https://deno.land/std@0.195.0/fmt/colors.ts";
import cliFormatDeno from "https://deno.land/x/cli_format_deno@3.0.10/src/mod.ts";

import { demauro } from "./lib/demauro.ts";
import { treccani } from "./lib/treccani.ts";
import { onli } from "./lib/onli.ts";
import { gdli } from "./lib/gdli.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const program = new Denomander({
    app_name: "big-dict",
    app_description: "Queries all the dictionaries with a single command",
    app_version: "0.1.0",
  });

  program
    .command("query [expression]", "Start a query")
    .option("-p --poly", "Include polyrhematic results")
    .addOption(
      new Option({
        flags: "-f --format",
        description: "Select output format",
      }).choices(["json", "human"]),
    )
    .action(async ({ expression }: { expression: string }) => {
      const results = (await Promise.all([
        demauro(expression),
        treccani(expression),
        onli(expression),
        gdli(expression),
      ])).flat();

      switch (program.format) {
        case "json":
          console.log(JSON.stringify(results, null, 2));
          break;
        default:
          for (const result of results) {
            console.log(Colors.yellow("-".repeat(80) + "\n"));
            console.log(Colors.dim(`SourceUrl: ${result.source.toString()}`));
            console.log(Colors.dim(`Published: ${result.published || "N/D"}`));
            const readable = result.fullText?.trim().replace(
              /\b\d\d\d\d\b/g,
              (year) => Colors.red(Colors.bold(year)),
            );
            console.log(
              "\n" + cliFormatDeno.wrap(readable!, { width: 80 }) + "\n",
            );
          }
          break;
      }
    })
    .parse(Deno.args);
}
