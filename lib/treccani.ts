import { load } from "npm:cheerio";
import { Attestation, Result } from "./base.ts";

async function treccaniScrape(url: URL): Promise<Result> {
  // NOTE: see https://github.com/denoland/deno/issues/6427
  const response = await fetch(`https://thingproxy.freeboard.io/fetch/${url}`);
  const html = await response.text();

  const visited = new Date();

  const $ = await load(html);
  $(".treccani-container-left_container .module-pdf-creator").remove();
  $(".treccani-container-left_container .module-share").remove();
  $(".treccani-container-left_container h1,div,p,br").after("\ue000");
  const fullText = $(".treccani-container-left_container")
    .text()
    .split("\ue000")
    .map((l) => l.trim().replaceAll(/\s+/g, " "))
    .join("\n")
    .replaceAll(/\n\n\n+/g, "\n\n");

  const pattern = /(?:\([^(]*?|[^(]{0,50})(\d\d\d\d)(?:[^)]*?\)|[^)]{0,50})/g;

  const years = fullText.matchAll(pattern);
  const attestations: Attestation[] = Array.from(years, ([context, year]) => {
    return { isoDate: year, context };
  });

  const published = ($(".module-briciole_di_pane").text().match(
    /\((\d\d\d\d)\)/,
  ) || [])[1]; // TODO: not really liking this

  return {
    source: url,
    visited,
    published,
    fullText,
    attestations,
  };
}

async function treccaniSearch(query: string, poly = false): Promise<URL[]> {
  const q = query.replace(" ", "-");
  return [
    new URL(`https://www.treccani.it/vocabolario/${q}_%28Neologismi%29/`),
    new URL(`https://www.treccani.it/enciclopedia/${q}_%28altro%29/`),
  ];
}

export async function treccani(query: string, poly = false) {
  const resultUrls = await treccaniSearch(query, poly);
  return await Promise.all(resultUrls.map(treccaniScrape));
}
