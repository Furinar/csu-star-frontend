/** 板块 key，与后端 wiki_sections.key 对齐；可扩展新板块 */
export type WikiSectionKey = string;

/** @deprecated 使用 WikiSectionKey；保留旧名兼容 */
export type WikiSection = WikiSectionKey;

export interface WikiDocMeta {
  id: string;
  slug: string;
  title: string;
  /** 后端 sort_order；缺省按 0 */
  sortOrder?: number;
}

export interface WikiGroup {
  id: string;
  name: string;
  /** 该学院下专业数；缺省时用 docs.length */
  docCount?: number;
  /** 后端 sort_order */
  sortOrder?: number;
  docs: WikiDocMeta[];
}

/** 单个板块的目录树（侧栏只渲染其中一个） */
export interface WikiSectionNode {
  key: string;
  title: string;
  allowCategories: boolean;
  /** 板块内文档总数（根文档 + 分组文档） */
  docCount?: number;
  /** 学院/分组数 */
  categoryCount?: number;
  docs: WikiDocMeta[];
  categories: WikiGroup[];
}

export interface WikiTree {
  sections: WikiSectionNode[];
}

export interface WikiDocDetail {
  id: string;
  section: WikiSectionKey;
  categoryName: string | null;
  slug: string;
  title: string;
  content: string;
  updatedAt: string | null;
}
