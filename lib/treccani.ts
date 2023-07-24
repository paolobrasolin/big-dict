import { CheerioAPI, load } from "npm:cheerio";
import { Attestation, Result } from "./base.ts";

async function fromURL(url: string) {
  const response = await fetch(
    new URL("https://thingproxy.freeboard.io/fetch/" + url),
  );
  const text = await response.text();
  return await load(text);
}

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

function extractCandidates($: CheerioAPI) {
  return $(".search_preview-title a")
    .map((_, el) => {
      const link = $(el);
      return {
        text: link.text().trim(),
        path: link.attr("href") as string,
      };
    })
    .toArray();
}

async function fetchRelated($: CheerioAPI) {
  return await Promise.all(
    $(".module-search-preview-more_results a.results-toggle")
      .map((_, el) => $(el).data("url") as string).toArray()
      .map((path) => `https://www.treccani.it${path}`)
      .map((url) => fromURL(url)),
  );
}

async function search(query: string, baseUrl: string): Promise<URL[]> {
  const q = query.replace(" ", "-");

  const searchResults: URL[] = [];
  let page = 1;
  while (true) {
    const source = `${baseUrl}/${q}/${page}/`;
    const $ = await fromURL(source);

    const pageResults = extractCandidates($)
      .concat(...(await fetchRelated($)).flatMap(extractCandidates))
      .filter(({ text }) => text.toLowerCase() == query.toLowerCase())
      .map(({ path }) => new URL(`https://www.treccani.it${path}`));

    searchResults.push(...pageResults);

    if (pageResults.length == 0) break;
    page += 1;
  }

  return searchResults;
}

export async function treccani(query: string): Promise<Result[]> {
  try {
    const resultsUrls: URL[] = [];
    console.log("3CNI | searching enciclopedia...");
    resultsUrls.push(
      ...await search(query, "https://www.treccani.it/enciclopedia/ricerca"),
    );
    console.log("3CNI | searching vocabolario...");
    resultsUrls.push(
      ...await search(query, "https://www.treccani.it/vocabolario/ricerca"),
    );
    console.log(`3CNI | found ${resultsUrls.length} results.`);
    console.log("3CNI | scraping...");
    const results = await Promise.all(resultsUrls.map(treccaniScrape));
    console.log("3CNI | success!");
    return results;
  } catch (e) {
    console.log(`3CNI | ${e}`);
    console.log("3CNI | failed!");
    return [];
  }
}
