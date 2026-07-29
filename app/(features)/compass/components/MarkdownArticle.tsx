"use client";

import {
  Children,
  createElement,
  forwardRef,
  isValidElement,
  useCallback,
  useState,
  type AnchorHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

function MarkdownLink({
  href,
  children,
  className,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!href) return <span {...rest}>{children}</span>;
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  }
  const externalClass = ["vp-external-link-icon", className]
    .filter(Boolean)
    .join(" ");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={externalClass}
      {...rest}
    >
      {children}
    </a>
  );
}

function HeadingWithAnchor({
  as,
  id,
  children,
  ...rest
}: {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  id?: string;
  children?: ReactNode;
} & ComponentPropsWithoutRef<"h1">) {
  return createElement(
    as,
    { id, tabIndex: -1, ...rest },
    children,
    id ? (
      <a
        className="header-anchor"
        href={`#${id}`}
        aria-label={`Permalink to “${id}”`}
      >
        ​
      </a>
    ) : null,
  );
}

function extractCodeMeta(children: ReactNode): {
  lang: string;
  text: string;
  child: ReactNode;
} {
  const child = Children.toArray(children)[0];
  if (!isValidElement(child)) {
    return { lang: "", text: String(children ?? ""), child: children };
  }
  const props = child.props as {
    className?: string;
    children?: ReactNode;
  };
  const match = /language-([\w-]+)/.exec(props.className ?? "");
  const raw = props.children;
  const text =
    typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? raw.map(String).join("")
        : String(raw ?? "");
  return { lang: match?.[1] ?? "", text, child: children };
}

function PreBlock({ children, ...rest }: ComponentPropsWithoutRef<"pre">) {
  const [copied, setCopied] = useState(false);
  const { lang, text } = extractCodeMeta(children);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [text]);

  return (
    <div className={`language-${lang || "text"}`}>
      <button
        type="button"
        className={`copy${copied ? " copied" : ""}`}
        title="复制代码"
        aria-label="复制代码"
        onClick={onCopy}
      />
      {lang ? <span className="lang">{lang}</span> : null}
      <pre {...rest}>{children}</pre>
    </div>
  );
}

const MarkdownArticle = forwardRef<HTMLDivElement, { content: string }>(
  function MarkdownArticle({ content }, ref) {
    return (
      <div ref={ref}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug]}
          components={{
            a: MarkdownLink,
            h1: (props) => <HeadingWithAnchor as="h1" {...props} />,
            h2: (props) => <HeadingWithAnchor as="h2" {...props} />,
            h3: (props) => <HeadingWithAnchor as="h3" {...props} />,
            h4: (props) => <HeadingWithAnchor as="h4" {...props} />,
            h5: (props) => <HeadingWithAnchor as="h5" {...props} />,
            h6: (props) => <HeadingWithAnchor as="h6" {...props} />,
            pre: PreBlock,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  },
);

export default MarkdownArticle;
