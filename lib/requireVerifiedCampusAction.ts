import type { UserProfile } from "@/types/auth";
import { requireAuthAction } from "@/lib/requireAuthAction";
import { feedback } from "@/store/useFeedbackStore";

type RouterLike = {
  push: (href: string) => void;
  replace?: (href: string) => void;
};

interface RequireVerifiedCampusActionOptions {
  isSignedIn: boolean;
  user: UserProfile | null;
  router: RouterLike;
}

export function requireVerifiedCampusAction({
  isSignedIn,
  user,
  router,
}: RequireVerifiedCampusActionOptions) {
  if (
    !requireAuthAction({
      isSignedIn,
      router,
      description: "登录后才能上传资源。",
    })
  ) {
    return false;
  }

  if (user?.email_verified) {
    return true;
  }

  feedback.warning({
    title: "请先完成校园邮箱认证",
    description: "未通过邮箱验证的账号暂不支持上传资源。",
  });
  router.push("/me");
  return false;
}
