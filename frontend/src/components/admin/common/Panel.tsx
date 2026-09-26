import { cn } from "@/src/utlis/cn";

/** White card used for forms, detail sections and lists. */
export default function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  noPadding,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}) {
  return (
    <section
      data-print-card
      className={cn(
        "rounded-2xl border border-gray-100 bg-white shadow-sm print:break-inside-avoid print:rounded-none print:border-0 print:shadow-none",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 print:px-0">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-bold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              {actions}
            </div>
          )}
        </header>
      )}
      <div className={cn(!noPadding && "p-5 print:px-0", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
