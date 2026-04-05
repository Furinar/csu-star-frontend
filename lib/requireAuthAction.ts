import { feedback } from "@/store/useFeedbackStore";

type RouterLike = {
  push: (href: string) => void;
  replace?: (href: string) => void;
};

interface RequireAuthActionOptions {
  isSignedIn: boolean;
  router: RouterLike;
  description: string;
  title?: string;
  redirect?: boolean;
  redirectMethod?: "push" | "replace";
  onUnauthed?: () => void;
}

export function requireAuthAction({
  isSignedIn,
  router,
  description,
  title = "请先登录",
  redirect = true,
  redirectMethod = "push",
  onUnauthed,
}: RequireAuthActionOptions) {
  if (isSignedIn) {
    return true;
  }

  feedback.warning({
    title,
    description,
  });

  onUnauthed?.();

  if (redirect) {
    if (redirectMethod === "replace" && typeof router.replace === "function") {
      router.replace("/login");
    } else {
      router.push("/login");
    }
  }

  return false;
}
