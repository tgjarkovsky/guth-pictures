"use client";

import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
import { contactEmail } from "@/lib/config";
import { readLeadSource } from "@/lib/lead-source";

type Status = "idle" | "sending" | "success" | "error";

const TOPICS = ["portraits", "business", "weddings", "events", "other"] as const;
type Topic = (typeof TOPICS)[number];
const isTopic = (v: string | null): v is Topic => TOPICS.includes(v as Topic);

export function ContactForm() {
  const t = useTranslations("kontakt");
  return (
    <Suspense fallback={<p><a href={`mailto:${contactEmail}`} className="underline">{t("email")}: {contactEmail}</a></p>}>
      <ContactFormFields />
    </Suspense>
  );
}

function ContactFormFields() {
  const t = useTranslations("kontakt");
  const [status, setStatus] = useState<Status>("idle");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const packageName = searchParams.get("package");
  const serviceName = searchParams.get("service");
  const topicParam = searchParams.get("topic");
  const initialTopic = isTopic(topicParam) ? topicParam : "";
  const initialMessage = packageName && serviceName
    ? t("packagePreset", { package: packageName, service: serviceName })
    : initialTopic ? t(`presets.${initialTopic}`) : "";
  const [topic, setTopic] = useState<Topic | "">(initialTopic);
  const [message, setMessage] = useState(initialMessage);
  const [preset, setPreset] = useState(initialMessage);

  // Swap the preset only while the visitor hasn't edited the text
  function handleTopicChange(next: Topic | "") {
    setTopic(next);
    const nextPreset = next ? t(`presets.${next}`) : "";
    if (message === preset || message.trim() === "") setMessage(nextPreset);
    setPreset(nextPreset);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const data = new FormData(form);
    // Shown in the inquiry email next to the message, so each inquiry says where it came from
    const lead = readLeadSource();
    data.set("page", pathname);
    if (packageName) data.set("package", packageName);
    if (lead) {
      data.set("source", lead.source);
      if (lead.medium) data.set("medium", lead.medium);
      if (lead.campaign) data.set("campaign", lead.campaign);
      if (lead.term) data.set("term", lead.term);
      if (lead.content) data.set("ad_content", lead.content);
      data.set("landing_page", lead.landingPage);
    }

    try {
      const res = await fetch(`https://formspree.io/f/${process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID}`, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      track("lead", {
        topic: topic || "none",
        page: pathname,
        package: packageName,
        source: lead?.source ?? "unknown",
        medium: lead?.medium ?? null,
        campaign: lead?.campaign ?? null,
      });
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (!process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID) {
    return <p className="text-[var(--color-text-muted)]">{t("notConfigured")}</p>;
  }

  if (status === "success") {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="p-4"
        style={{
          background: "var(--color-success-bg)",
          border: "1px solid var(--color-success-border)",
          color: "var(--color-success-fg)",
        }}
      >
        {t("success")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="contact-name" className="block text-sm text-[var(--color-text)] font-medium mb-1">{t("name")}</label>
        <input
          id="contact-name"
          type="text"
          name="name"
          required
          placeholder={t("namePlaceholder")}
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-ghost)] px-4 py-3 focus:outline-none focus:border-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-border)] transition-colors"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm text-[var(--color-text)] font-medium mb-1">{t("email")}</label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          placeholder={t("emailPlaceholder")}
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-ghost)] px-4 py-3 focus:outline-none focus:border-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-border)] transition-colors"
        />
      </div>
      <div>
        <label htmlFor="contact-topic" className="block text-sm text-[var(--color-text)] font-medium mb-1">{t("topic")}</label>
        <select
          id="contact-topic"
          name="topic"
          value={topic}
          onChange={(e) => handleTopicChange(e.target.value as Topic | "")}
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 focus:outline-none focus:border-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-border)] transition-colors"
        >
          <option value="">{t("topicPlaceholder")}</option>
          {TOPICS.map((key) => <option key={key} value={key}>{t(`topics.${key}`)}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm text-[var(--color-text)] font-medium mb-1">{t("message")}</label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-ghost)] px-4 py-3 focus:outline-none focus:border-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-border)] transition-colors resize-none"
        />
      </div>
      {status === "error" && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 text-sm"
          style={{
            background: "var(--color-error-bg)",
            border: "1px solid var(--color-error-border)",
            color: "var(--color-error-fg)",
          }}
        >
          {t.rich("error", {
            email: contactEmail,
            link: (chunks) => (
              <a href={`mailto:${contactEmail}`} className="underline hover:opacity-80 transition-opacity">
                {chunks}
              </a>
            ),
          })}
        </div>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="px-6 py-3 bg-[var(--color-text)] text-[var(--color-bg)] font-medium hover:opacity-85 transition-opacity disabled:opacity-50"
      >
        {status === "sending" ? t("sending") : t("send")}
      </button>
    </form>
  );
}
