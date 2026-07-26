import Link from "next/link";

const womenSizes = [
  { size: "XS", chest: "32-33", waist: "25-26", hips: "35-36" },
  { size: "S", chest: "34-35", waist: "27-28", hips: "37-38" },
  { size: "M", chest: "36-37", waist: "29-30", hips: "39-40" },
  { size: "L", chest: "38-40", waist: "31-33", hips: "41-43" },
  { size: "XL", chest: "41-43", waist: "34-36", hips: "44-46" },
];

const menSizes = [
  { size: "S", chest: "36-38", waist: "30-32", shoulder: "17-17.5" },
  { size: "M", chest: "39-41", waist: "33-35", shoulder: "18-18.5" },
  { size: "L", chest: "42-44", waist: "36-38", shoulder: "19-19.5" },
  { size: "XL", chest: "45-47", waist: "39-41", shoulder: "20-20.5" },
  { size: "XXL", chest: "48-50", waist: "42-44", shoulder: "21-21.5" },
];

function SizeTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: Record<string, string>[];
  columns: { key: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="font-display text-headline-sm">{title}</h2>
      <div className="mt-4 overflow-x-auto border border-border-subtle">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((row) => (
              <tr key={row.size}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-label-sm text-text-muted">All measurements in inches.</p>
    </div>
  );
}

export default function SizeGuidePage() {
  return (
    <div className="container-luxe py-16">
      <p className="label-caps text-gold">Reference</p>
      <h1 className="mt-2 font-display text-headline-md">Size Guide</h1>
      <p className="mt-3 max-w-xl text-body-md text-text-muted">
        Use the charts below for ready-to-wear sizing. For a guaranteed fit,
        book a{" "}
        <Link href="/tailoring" className="text-on-surface underline">
          custom tailoring appointment
        </Link>{" "}
        instead.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-16 lg:grid-cols-2">
        <SizeTable
          title="Women"
          rows={womenSizes}
          columns={[
            { key: "size", label: "Size" },
            { key: "chest", label: "Chest" },
            { key: "waist", label: "Waist" },
            { key: "hips", label: "Hips" },
          ]}
        />
        <SizeTable
          title="Men"
          rows={menSizes}
          columns={[
            { key: "size", label: "Size" },
            { key: "chest", label: "Chest" },
            { key: "waist", label: "Waist" },
            { key: "shoulder", label: "Shoulder" },
          ]}
        />
      </div>

      <div className="mt-16 border-t border-border-subtle pt-10">
        <h2 className="font-display text-headline-sm">How to Measure</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <p className="label-caps text-text-muted">Chest / Bust</p>
            <p className="mt-2 text-body-md text-text-muted">
              Measure around the fullest part of your chest, keeping the tape
              level.
            </p>
          </div>
          <div>
            <p className="label-caps text-text-muted">Waist</p>
            <p className="mt-2 text-body-md text-text-muted">
              Measure around your natural waistline, above the belly button.
            </p>
          </div>
          <div>
            <p className="label-caps text-text-muted">Hips</p>
            <p className="mt-2 text-body-md text-text-muted">
              Measure around the fullest part of your hips, roughly 8 inches
              below your waist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
