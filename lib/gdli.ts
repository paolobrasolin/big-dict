import { load } from "npm:cheerio";
import { Attestation, Result } from "./base.ts";

type GdliMatch = {
  doc: number;
  pos: number;
  src: URL;
};

async function scrapeGdli({ doc, pos, src }: GdliMatch): Promise<Result> {
  const url = new URL("https://www.gdli.it/Ricerca/ContestoEsteso");
  url.searchParams.set("i", doc.toString());
  url.searchParams.set("pos", pos.toString());

  const response = await fetch(url, { method: "POST" });
  const json: { contesto: string } = await response.json();
  const html = json.contesto;

  const visited = new Date();

  const $ = await load(html);
  const fullText = $.text().trim();

  const attestations: Attestation[] = [];

  const published = null;

  return {
    source: src,
    visited,
    published,
    fullText,
    attestations,
  };
}

async function searchGdli(query: string): Promise<GdliMatch[]> {
  const source = new URL("https://www.gdli.it/Ricerca/Libera");

  // TODO: handle param to match accents
  source.searchParams.set("q", query);

  const searchResults: GdliMatch[] = [];
  let page = 1;
  while (true) {
    source.searchParams.set("page", page.toString());

    const response = await fetch(source);
    const html = await response.text();
    const $ = await load(html);

    const pageResults = $("#risultati p.text-right")
      .filter((_, el) =>
        $(el).prev("p").find(".highligth")
          .text().trim().toLowerCase() == query.toLowerCase()
      ).map((_, el): GdliMatch => {
        const ext = $(el).find("button[data-doc][data-pos]");
        const src = $(el).find("a[href^=/sala-lettura]");
        return {
          doc: ext.data("doc") as number,
          pos: ext.data("pos") as number,
          src: new URL(`https://www.gdli.it${src.attr("href")}`),
        };
      })
      .toArray();

    searchResults.push(...pageResults);

    if (pageResults.length == 0) break;
    page += 1;
  }

  return searchResults;
}

export async function gdli(query: string): Promise<Result[]> {
  try {
    console.log("GDLI | searching...");
    const resultsUrls = await searchGdli(query);
    console.log(`GDLI | found ${resultsUrls.length} results.`);
    console.log("GDLI | scraping...");
    const results = await Promise.all(resultsUrls.map(scrapeGdli));
    console.log("GDLI | success!");
    return results;
  } catch (e) {
    console.log(`GDLI | ${e}`);
    console.log("GDLI | failed!");
    return [];
  }
}
