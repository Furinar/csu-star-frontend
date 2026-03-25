export default function GlassCard({
                                    children,
                                    className = "",
                                  }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
      <div
          className={`bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-2xl ${className}`}
      >
        {children}
      </div>
  )
};