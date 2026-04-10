import FaSvgIcon from "@/components/ui/FaSvgIcon";

export default function StarRating({
  score,
  size = "10px",
  fillClassName = "text-[#ffb400]",
}: {
  score: number;
  size?: string;
  fillClassName?: string;
}) {
  const fillWidth = `${(score / 5) * 100}%`;

  return (
    <div
      className="relative inline-block shrink-0 whitespace-nowrap leading-none text-gray-400"
      style={{ fontSize: size || "10px" }}
    >
      <FaSvgIcon name="star" />
      <FaSvgIcon name="star" />
      <FaSvgIcon name="star" />
      <FaSvgIcon name="star" />
      <FaSvgIcon name="star" />
      <div
        className={`absolute top-0 left-0 h-full overflow-hidden ${fillClassName}`}
        style={{ width: fillWidth }}
      >
        <FaSvgIcon name="star" />
        <FaSvgIcon name="star" />
        <FaSvgIcon name="star" />
        <FaSvgIcon name="star" />
        <FaSvgIcon name="star" />
      </div>
    </div>
  );
}
