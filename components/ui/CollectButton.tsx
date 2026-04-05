import React from "react";
import { useRouter } from "next/navigation";
import { addFavorite, removeFavorite } from "@/api/detail";
import { useAuthStore } from "@/store/useAuthStore";
import { requireAuthAction } from "@/lib/requireAuthAction";
import { feedback } from "@/store/useFeedbackStore";

interface CollectButtonProps {
  size?: "sm" | "md" | "lg";
  isCollected?: boolean;
  onClick?: () => void;
  onStatusChange?: (nextCollected: boolean) => void;
  targetId?: number | string;
  targetType?: "resource" | "course" | "teacher";
  initialStatus?: boolean;
  className?: string;
  activeColor?: string;
}

export default function CollectButton({
  size = "md",
  isCollected = true,
  onClick,
  onStatusChange,
  targetId,
  targetType,
  initialStatus,
  className = "",
  activeColor = "text-white",
}: CollectButtonProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const [collected, setCollected] = React.useState(initialStatus ?? isCollected);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setCollected(initialStatus ?? isCollected);
  }, [initialStatus, isCollected]);

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

  const handleClick = async () => {
    if (loading) return;

    if (!targetId || !targetType) {
      onClick?.();
      return;
    }

    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能收藏内容。",
      })
    ) {
      return;
    }

    try {
      setLoading(true);
      if (collected) {
        await removeFavorite(targetType, String(targetId));
      } else {
        await addFavorite(targetType, String(targetId));
      }
      const nextCollected = !collected;
      setCollected(nextCollected);
      onStatusChange?.(nextCollected);
      feedback.success({
        title: collected ? "已取消收藏" : "收藏成功",
      });
      onClick?.();
    } catch (error) {
      console.error(error);
      feedback.error({
        title: "收藏操作失败",
        description: "请稍后重试。",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`group relative flex items-center justify-center rounded-full border border-gray-200 bg-white cursor-pointer overflow-hidden transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${s.button} ${className}`}
    >
      <span
        className={`absolute left-[4px] z-10 flex items-center justify-center rounded-full overflow-hidden transition-all duration-300 ${s.iconCont} ${s.iconContHover} ${collected ? "bg-[image:var(--page-accent-gradient)] shadow-[0_10px_24px_var(--page-accent-soft-strong)]" : "bg-gray-300"}`}
      >
        <svg
          viewBox="0 0 384 512"
          height="0.9em"
          className={`rounded-[1px] fill-white ${collected ? activeColor : ""}`}
        >
          <path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z" />
        </svg>
      </span>
      <p
        className={`z-0 flex h-full items-center justify-center text-gray-800 transition-all duration-300 ml-auto mr-[4px] ${s.text} group-hover:w-0 group-hover:text-[0px] ${s.textHover}`}
      >
        {loading ? "..." : collected ? "已收藏" : "收藏"}
      </p>
    </button>
  );
}
