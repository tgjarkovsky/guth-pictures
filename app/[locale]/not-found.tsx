import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";

export default async function NotFound() {
  const locale = await getLocale();
  const cs = locale === "cs";

  return (
    <EditorialSubpage active={null} className="ed-center">
      <p className="ed-center__code">404</p>
      <h1>
        {cs ? "Stránka nenalezena" : "Page not found"}
      </h1>
      <p>
        {cs
          ? "Stránka, kterou hledáš, neexistuje nebo byla přesunuta."
          : "The page you're looking for doesn't exist or has been moved."}
      </p>
      <Link
        href="/"
        className="ed-cta"
      >
        {cs ? "Zpět na úvod" : "Back to home"}
      </Link>
    </EditorialSubpage>
  );
}
