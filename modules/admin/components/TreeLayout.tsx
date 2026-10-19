"use client";

// Three-column admin editor: section tree | one section's fields | live preview.
// On lg+ it breaks out of the narrow admin column to (almost) full viewport width.
const GRID =
  "lg:grid lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6 lg:items-start lg:w-[min(96vw,1800px)] lg:ml-[calc(50%_-_min(48vw,900px))]";
const COLUMN = "lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto";

export type TreeItem = { id: string; label: string; dirty?: boolean; thumb?: string };
export type TreeGroup = { title: string; items: TreeItem[] };

type Props = {
  groups: TreeGroup[];
  selected: string;
  onSelect: (id: string) => void;
  search?: { value: string; onChange: (value: string) => void };
  children: React.ReactNode;
  preview: React.ReactNode;
};

export function TreeLayout({ groups, selected, onSelect, search, children, preview }: Props) {
  const visible = groups.filter((group) => group.items.length > 0);
  return (
    <div className={GRID}>
      <nav aria-label="Sekce" className={`${COLUMN} mb-4 lg:mb-0 space-y-2`}>
        {search && (
          <input
            type="search"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder="Hledat text nebo pole…"
            className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/40"
          />
        )}
        <select
          aria-label="Vybrat sekci"
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="lg:hidden w-full bg-zinc-900 border border-white/10 px-3 py-2 text-sm"
        >
          {visible.map((group) => (
            <optgroup key={group.title} label={group.title}>
              {group.items.map((item) => <option key={item.id} value={item.id}>{item.label}{item.dirty ? " •" : ""}</option>)}
            </optgroup>
          ))}
        </select>
        <div className="hidden lg:block">
          {visible.length === 0 && <p className="px-2 py-3 text-sm text-gray-500">Nic nenalezeno.</p>}
          {visible.map((group) => (
            <details
              key={group.title}
              open={Boolean(search?.value) || group.items.some((item) => item.id === selected)}
              className="group/tree"
            >
              <summary className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-200 hover:text-white">
                <span className="text-gray-500 transition-transform group-open/tree:rotate-90">›</span>
                <span className="flex-1">{group.title}</span>
                {group.items.some((item) => item.dirty) && <Dot />}
              </summary>
              <ul className="mb-1 ml-3 border-l border-white/10">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={item.id === selected ? "true" : undefined}
                      onClick={() => onSelect(item.id)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                        item.id === selected ? "bg-white text-black" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {item.thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumb} alt="" className="h-6 w-6 flex-none object-cover" />
                      )}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.dirty && <Dot />}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </nav>
      <div className={`${COLUMN} mb-8 lg:mb-0`}>{children}</div>
      {preview}
    </div>
  );
}

function Dot() {
  return <span title="Neuložené změny" className="h-2 w-2 flex-none rounded-full bg-amber-400" />;
}

// Opens collapsed ancestors of the field at `path` (or its closest rendered parent) and focuses it.
export function focusField(root: HTMLElement | null, path: string) {
  if (!root) return;
  const parts = path.split(".");
  let target: HTMLElement | null = null;
  while (parts.length && !target) {
    target = root.querySelector<HTMLElement>(`[data-path="${CSS.escape(parts.join("."))}"]`);
    parts.pop();
  }
  if (!target) return;
  for (let node: HTMLElement | null = target; node && node !== root; node = node.parentElement) {
    if (node instanceof HTMLDetailsElement) node.open = true;
  }
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  target.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
}
