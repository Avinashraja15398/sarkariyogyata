'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.print();
        }
      }}
      className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-black text-white hover:bg-blue-700 shadow transition-all cursor-pointer"
    >
      🖨️ Print / Save PDF
    </button>
  );
}