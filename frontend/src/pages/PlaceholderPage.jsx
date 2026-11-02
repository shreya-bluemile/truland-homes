export default function PlaceholderPage({ title, upcoming = false }) {
  return (
    <div className="rounded-[4px] border-[0.909px] border-line bg-white p-8 text-center">
      <h1 className="text-[16px] font-bold text-ink">{title}</h1>
      <p className="mt-2 text-[12px] text-muted">
        {upcoming ? 'This screen is being built as part of the Contractor Quotations module.' : 'This section isn’t part of the Contractor Quotations module.'}
      </p>
    </div>
  )
}
