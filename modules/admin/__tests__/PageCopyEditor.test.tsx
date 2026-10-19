import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PageCopyEditor } from "../components/PageCopyEditor";
import { defaultPageCopy } from "../lib/page-copy";

it("renders every editable text of a page including list items", () => {
  const template = defaultPageCopy("cs").business;
  const value = { ...template, heroTitle: "Upravený nadpis" };
  const html = renderToStaticMarkup(<PageCopyEditor path="pages.business" label="" value={value} template={template} onChange={() => {}} />);
  expect(html).toContain("Upravený nadpis");
  expect(html).toContain(template.faq[0].q);
  expect(html).toContain("Odpověď");
  expect(html).toContain("+ Přidat");
  expect(html).not.toContain(template.extrasTitle);
});

it("collapses list items under their first text and tags fields with data-path", () => {
  const template = defaultPageCopy("cs").services;
  const html = renderToStaticMarkup(<PageCopyEditor path="pages.services" label="" value={template} template={template} onChange={() => {}} />);
  expect(html).toContain(`<details data-path="pages.services.faq.0"`);
  expect(html).toContain(`data-path="pages.services.faq.0.a"`);
  expect(html).toContain(`data-path="pages.services.title"`);
});
