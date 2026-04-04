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
      className="star-rating relative inline-block leading-none text-gray-400"
      style={{ fontSize: size || "10px" }}
    >
      <i className="fa fa-star" />
      <i className="fa fa-star" />
      <i className="fa fa-star" />
      <i className="fa fa-star" />
      <i className="fa fa-star" />
      <div
        className={`star-fill absolute top-0 left-0 h-full overflow-hidden ${fillClassName}`}
        style={{ width: fillWidth }}
      >
        <i className="fa fa-star" />
        <i className="fa fa-star" />
        <i className="fa fa-star" />
        <i className="fa fa-star" />
        <i className="fa fa-star" />
      </div>
    </div>
  );
}
