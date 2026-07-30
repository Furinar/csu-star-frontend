/**
 * 账号邮箱的规范化与校验。
 *
 * 注意：这里刻意 **不** 自动补全域名。历史实现（toCsuEmail / toCampusEmail）
 * 会把用户输入的前缀拼成 `xxx@csu.edu.cn`，邮箱域名放开后这会让填了
 * `foo@qq.com` 的人把验证码发到一个不存在的校园邮箱。
 */

const EMAIL_RE = /^[^\s@]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

/** 去空格并转小写，与后端 emailpolicy.Normalize 的行为保持一致。 */
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/** 判断是否为格式合法的邮箱。要求域名至少含一个点。 */
export function isValidEmail(value: string) {
  const normalized = normalizeEmail(value);
  return normalized.length <= 254 && EMAIL_RE.test(normalized);
}

/** 返回邮箱的域名部分，用于判断是否需要展示校园邮箱专属提示。 */
export function emailDomain(value: string) {
  const normalized = normalizeEmail(value);
  const at = normalized.lastIndexOf("@");
  return at >= 0 ? normalized.slice(at + 1) : "";
}

/** 是否为中南大学校园邮箱。仅用于决定要不要展示「打开校园邮箱」这类提示。 */
export function isCampusEmail(value: string) {
  return emailDomain(value) === "csu.edu.cn";
}
