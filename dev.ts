import Denomander from "https://deno.land/x/denomander/mod.ts";
import { demauro } from "./lib/demauro.ts";
import { onli } from "./lib/onli.ts";
import { treccani } from "./lib/treccani.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const expression = "luna";
  const results = (await Promise.all([
    demauro(expression),
    treccani(expression),
    onli(expression),
  ])).flat();
  console.log(JSON.stringify(results, null, 2));
}
