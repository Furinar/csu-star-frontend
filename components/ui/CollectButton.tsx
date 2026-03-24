import React from "react";

interface CollectButtonProps {
  size?: "sm" | "md" | "lg";
  isCollected?: boolean;
  onClick?: () => void;
}

export default function CollectButton({
  size = "md",
  isCollected = true,
  onClick,
}: CollectButtonProps) {
  const sizeStyles = {
    sm: {
      button: "w-[80px] h-[32px]",
      iconCont: "w-[24px] h-[24px]",
      iconContHover: "group-hover:w-[72px]",
      text: "w-[48px] text-[0.8em]",
      textHover: "group-hover:translate-x-[6px]",
    },
    md: {
      button: "w-[100px] h-[40px]",
      iconCont: "w-[30px] h-[30px]",
      iconContHover: "group-hover:w-[90px]",
      text: "w-[60px] text-[1.04em]",
      textHover: "group-hover:translate-x-[10px]",
    },
    lg: {
      button: "w-[120px] h-[48px]",
      iconCont: "w-[36px] h-[36px]",
      iconContHover: "group-hover:w-[108px]",
      text: "w-[72px] text-[1.2em]",
      textHover: "group-hover:translate-x-[14px]",
    },
  };

  const s = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center justify-center rounded-full border border-gray-200 dark:border-white/20 bg-white dark:bg-[#0c0c0c] cursor-pointer overflow-hidden transition-all duration-300 active:scale-95 ${s.button}`}
    >
      <span
        className={`absolute left-[4px] z-10 flex items-center justify-center rounded-full overflow-hidden transition-all duration-300 ${s.iconCont} ${s.iconContHover} ${isCollected ? "bg-gradient-to-b from-[#ff88ff] to-[#ac46ff] dark:from-blue-400 dark:to-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <svg
          viewBox="0 0 384 512"
          height="0.9em"
          className="fill-white rounded-[1px]"
        >
          <path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z" />
        </svg>
      </span>
      <p
        className={`z-0 flex h-full items-center justify-center text-gray-800 dark:text-white transition-all duration-300 ml-auto mr-[4px] ${s.text} group-hover:w-0 group-hover:text-[0px] ${s.textHover}`}
      >
        {isCollected ? "Saved" : "Save"}
      </p>
    </button>
  );
}
