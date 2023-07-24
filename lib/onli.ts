import { load } from "npm:cheerio";
import { Attestation, Result } from "./base.ts";

async function scrapeOnli(url: URL): Promise<Result> {
  const response = await fetch(url);
  const html = await response.text();

  const visited = new Date();

  const $ = await load(html);
  $(".boxcontent ul").remove();
  $(".boxcontent div,p,li,br").after("\ue000");
  const fullText = $(".boxcontent")
    .text()
    .split("\ue000")
    .map((l) => l.trim().replaceAll(/\s+/g, " "))
    .join("\n")
    .replaceAll(/\n\n\n+/g, "\n\n");

  const pattern = /(?:\([^(]*?|[^(]{0,50})(\d\d\d\d)(?:[^)]*?\)|[^)]{0,50})/g; // TODO: write specific pattern
  const years = fullText.matchAll(pattern);
  const attestations: Attestation[] = Array.from(years, ([context, year]) => {
    return { isoDate: year, context };
  });

  const published = (fullText.match(
    /^Pubblicato in: .*? (\d\d\d\d)/m,
  ) || [])[1]; // TODO: not really liking this

  return {
    source: url,
    visited,
    published,
    fullText,
    attestations,
  };
}

async function searchOnli(query: string): Promise<URL[]> {
  const source = new URL("https://www.iliesi.cnr.it/ONLI/ricerca.php");

  // TODO: use different param depending on query boundaries
  source.searchParams.set("entry3", query);

  const searchResults: URL[] = [];
  let page = 1;
  while (true) {
    source.searchParams.set("page", page.toString());

    const response = await fetch(source);
    const html = await response.text();
    const $ = await load(html);

    const pageResults = $("#contentbd table a[href^=entrata.php]")
      .map((_, el) => $(el).attr("href"))
      .map((_, href) => new URL(`https://www.iliesi.cnr.it/ONLI/${href}`))
      .toArray();

    searchResults.push(...pageResults);

    if (pageResults.length == 0) break;
    page += 1;
  }

  return searchResults;
}

export async function onli(query: string): Promise<Result[]> {
  try {
    console.log("ONLI | searching...");
    const resultsUrls = await searchOnli(query);
    console.log(`ONLI | found ${resultsUrls.length} results.`);
    console.log("ONLI | scraping...");
    const results = await Promise.all(resultsUrls.map(scrapeOnli));
    console.log("ONLI | success!");
    return results;
  } catch (e) {
    console.log(`ONLI | ${e}`);
    console.log("ONLI | failed!");
    return [];
  }
}
