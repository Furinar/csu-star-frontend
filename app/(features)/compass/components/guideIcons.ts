import type { ComponentType } from "react";
import {
  BookIcon,
  BookmarkIcon,
  ChartBarIcon,
  ChatIcon,
  CodeIcon,
  CompassIcon,
  EducationIcon,
  FlagIcon,
  HeartIcon,
  LightbulbIcon,
  UserIcon,
} from "tdesign-icons-react";

type IconComponent = ComponentType<{ size?: string | number; className?: string }>;

/** 入坑指南 slug → 图标（匹配不上时用默认指南图标） */
const GUIDE_ICON_MAP: Record<string, IconComponent> = {
  入学基础须知篇: EducationIcon,
  选课篇: BookmarkIcon,
  绩点篇: ChartBarIcon,
  科研篇: LightbulbIcon,
  竞赛篇: FlagIcon,
  社团篇: UserIcon,
  社交恋爱篇: HeartIcon,
  奋斗篇: FlagIcon,
  摸鱼篇: ChatIcon,
  番外篇: BookIcon,
  代码: CodeIcon,
};

export function getGuideIcon(slug: string, title?: string): IconComponent {
  return (
    GUIDE_ICON_MAP[slug] ??
    (title ? GUIDE_ICON_MAP[title] : undefined) ??
    CompassIcon
  );
}
