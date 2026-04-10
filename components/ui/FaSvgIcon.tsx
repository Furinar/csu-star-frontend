import type { CSSProperties } from "react";

const iconPathMap = {
  "book-open": "/fa/book-open-solid-full.svg",
  "building-columns": "/fa/building-columns-solid-full.svg",
  "chalkboard-user": "/fa/chalkboard-user-solid-full.svg",
  check: "/fa/check-solid-full.svg",
  "css3-alt": "/fa/css3-alt-brands-solid-full.svg",
  database: "/fa/database-solid-full.svg",
  github: "/fa/github-brands-solid-full.svg",
  golang: "/fa/golang-brands-solid-full.svg",
  google: "/fa/google-brands-solid-full.svg",
  "graduation-cap": "/fa/graduation-cap-solid-full.svg",
  js: "/fa/js-brands-solid-full.svg",
  python: "/fa/python-brands-solid-full.svg",
  qq: "/fa/qq-brands-solid-full.svg",
  react: "/fa/react-brands-solid-full.svg",
  rocket: "/fa/rocket-solid-full.svg",
  star: "/fa/star-solid-full.svg",
} as const;

export type FaSvgIconName = keyof typeof iconPathMap;

export default function FaSvgIcon({
  name,
  className,
  style,
}: {
  name: FaSvgIconName;
  className?: string;
  style?: CSSProperties;
}) {
  const iconStyle = {
    width: "1em",
    height: "1em",
    display: "inline-block",
    flexShrink: 0,
    backgroundColor: "currentColor",
    WebkitMaskImage: `url(${iconPathMap[name]})`,
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    WebkitMaskSize: "contain",
    maskImage: `url(${iconPathMap[name]})`,
    maskRepeat: "no-repeat",
    maskPosition: "center",
    maskSize: "contain",
    ...style,
  } satisfies CSSProperties;

  return <span aria-hidden="true" className={className} style={iconStyle} />;
}
