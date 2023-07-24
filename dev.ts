import Denomander from "https://deno.land/x/denomander/mod.ts";
import { demauro } from "./lib/demauro.ts";
import { onli } from "./lib/onli.ts";
import { treccani } from "./lib/treccani.ts";
import { gdli } from "./lib/gdli.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const expression = "allunare";
  const results = (await Promise.all([
    demauro(expression),
    treccani(expression),
    onli(expression),
    gdli(expression),
  ])).flat();
  console.log(JSON.stringify(results, null, 2));
}
