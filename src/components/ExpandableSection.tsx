import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ExpandableSectionProps {
  label: string;
  accent: string;
  defaultOpen?: boolean;
  meta?: ReactNode;
  children: ReactNode;
}

// Section wrapper used across Shared Reality / Where to Play / How to Win so the
// reporting subtabs share the same expand/collapse treatment as the Key Agentic Insights.
export default function ExpandableSection({
  label,
  accent,
  defaultOpen = true,
  meta,
  children,
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 rounded-full shrink-0" style={{ background: accent }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {meta}
          <ChevronDown
            size={13}
            className="text-muted-foreground transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
