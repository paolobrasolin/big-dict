import { load } from "npm:cheerio";
import { Attestation, Result } from "./base.ts";

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

export async function demauro(query: string, poly = false) {
  const resultUrls = await demauroSearch(query, poly);
  return await Promise.all(resultUrls.map(demauroScrape));
}
