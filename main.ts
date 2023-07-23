import { demauro } from "./lib/demauro.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const results = await demauro("pene");
  console.log(JSON.stringify(results, null, 2));
}
