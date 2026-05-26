/** Colorful SenzCraft wordmark — capital S */
export default function SenzCraftBrand({
  className = "text-base",
}: {
  className?: string
}) {
  return (
    <span
      className={`font-bold leading-tight ${className}`}
      style={{
        background: "linear-gradient(90deg, #1570ef 0%, #7c3aed 35%, #ec4899 65%, #f59e0b 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      SenzCraft
    </span>
  )
}
