import { useEffect, useRef, useState } from "react";

interface Props {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
}

export default function SearchableDropdown({
  options,
  selected,
  onSelect,
  placeholder = "Select…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(""); // reset search when closing
      }
    };
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, []);

  const filtered = options.filter((o) =>
    o
      .toLowerCase()
      .trim()
      .replaceAll(" ", "")
      .replaceAll("_", "")
      .includes(
        query.toLowerCase().trim().replaceAll(" ", "").replaceAll("_", ""),
      ),
  );

  return (
    <div className="relative w-[180px]" ref={ref}>
      {/* trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none"
      >
        <span className="w-full overflow-hidden">
          {selected ?? <span className="text-gray-500">{placeholder}</span>}
        </span>

        {/* lightweight chevron */}
        <svg
          className={`h-4 w-4 transform transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="black"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 rounded-md border bg-white shadow-lg w-[220px]">
          <input
            autoFocus
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="m-2 w-[calc(100%-1rem)] rounded-md border px-2 py-1 text-sm focus:outline-none text-white placeholder:text-white bg-gray-200"
          />

          <ul className="max-h-[70vh] overflow-y-auto">
            {filtered.length ? (
              filtered.map((opt) => (
                <li
                  key={opt}
                  onClick={() => {
                    onSelect(opt);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
                >
                  {opt}
                </li>
              ))
            ) : (
              <li className="p-2 text-sm text-gray-100">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
