import { load } from "npm:cheerio";

type Attestation = {
  isoDate: string;
  context: string;
};

type Result = {
  source: URL;
  visited: Date;
  published: string | null;
  fullText?: string;
  attestations: Attestation[];
};

async function demauroScrape(url: URL): Promise<Result> {
  const response = await fetch(url);
  const html = await response.text();

  const visited = new Date();
  const published = null;

  const $ = await load(html);
  $("#polirematiche").remove();
  $("#lemma .item_note").remove();
  $("#lemma .item_share").remove();
  $("#lemma h1,section,br").after("\ue000");
  const fullText = $("#lemma")
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

  return {
    source: url,
    visited,
    published,
    fullText,
    attestations,
  };
}

async function demauroSearch(query: string, poly = false): Promise<URL[]> {
  const source = new URL(
    `https://dizionario.internazionale.it/cerca/${query}`,
  );

  const response = await fetch(source);
  const html = await response.text();
  const $ = await load(html);

  const matcher = poly
    ? "li.li_elements_result_lemma a.serp-lemma-title,a.serp-poli-title"
    : "li.li_elements_result_lemma a.serp-lemma-title";

  return $(matcher)
    .map((_, el) => $(el).attr("href"))
    .map((_, href) => new URL(href))
    .toArray();
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const resultUrls = await demauroSearch("pene");
  const results = await Promise.all(resultUrls.map(demauroScrape));
  console.log(JSON.stringify(results, null, 2));
}
