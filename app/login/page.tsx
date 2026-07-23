"use client";

import {useEffect, useState} from "react";
import styles from "./style.module.css";
import {useRouter, useSearchParams} from "next/navigation";
import {loginByEmail, sendCaptcha, verifyEmail} from "@/api/auth";
import Link from "next/link";
import CryptoJS from "crypto-js";
import {useTimer} from "@/hooks/useTimer";
import {useAuthStore} from "@/store/useAuthStore";
import {feedback} from "@/store/useFeedbackStore";
import FaSvgIcon from "@/components/ui/FaSvgIcon";
import {showCaptchaSendFailureFeedback, showCaptchaSentFeedback} from "@/lib/campusMail";
import {
  type AuthPlatform,
  buildAuthUrl,
  createOAuthState,
  createPkcePair,
  isMobileDevice,
  OAUTH_CONTEXT_STORAGE_KEY,
  type OAuthContext,
} from "@/lib/oauth";

export default function Login() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const searchParams = useSearchParams();
  // Login部分
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [Loading, setLoading] = useState(false);
  // Register部分
  const [showRegisterPwd, setShowRegisterPwd] = useState(false);
  const {countdown, startTimer} = useTimer(0);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerCode, setRegisterCode] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const inviteCode = searchParams.get("invite_code")?.trim() ?? "";

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "true") {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [searchParams]);

  const toCsuEmail = (value: string) => {
    const prefix = value.split("@")[0].trim().toLowerCase();
    return `${prefix}@csu.edu.cn`;
  };

  const handleOAuthLogin = async (platform: AuthPlatform) => {
    const state = createOAuthState(platform);
    const {codeChallenge, codeVerifier} = await createPkcePair();
    const context: OAuthContext = {
      state,
      platform,
      codeChallenge,
      codeVerifier,
      action: "login",
    };
    localStorage.setItem(OAUTH_CONTEXT_STORAGE_KEY, JSON.stringify(context));
    window.location.assign(
        buildAuthUrl(platform, state, codeChallenge, isMobileDevice()),
    );
  };

  const handleSendCode = async () => {
    if (countdown > 0) return;

    const emailPrefix = registerEmail.trim();
    if (!emailPrefix) {
      setRegisterError("请先填写学号(邮箱前缀)");
      return;
    }

    setRegisterError("");
    setIsSendingCode(true);

    try {
      await sendCaptcha(toCsuEmail(emailPrefix), "register");
      showCaptchaSentFeedback(`请查收 ${toCsuEmail(emailPrefix)} 的邮件。`, "register");
    } catch (error) {
      const message = showCaptchaSendFailureFeedback(error, {
        title: "验证码发送失败",
        defaultDescription: "验证码发送失败，请稍后重试",
        scene: "register",
      });
      setRegisterError(message);
      setIsSendingCode(false);
      return;
    }

    setIsSendingCode(false);
    startTimer(60);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
        !registerEmail.trim() ||
        !registerPassword.trim() ||
        !registerCode.trim()
    ) {
      setRegisterError("请完整填写邮箱、密码和验证码");
      return;
    }

    if (registerPassword.trim().length < 8) {
      setRegisterError("密码至少需要8位");
      return;
    }

    setRegisterError("");
    setIsRegisterSubmitting(true);

    try {
      const email = toCsuEmail(registerEmail);
      await verifyEmail(email, registerCode.trim());

      const hashPwd = CryptoJS.SHA256(registerPassword).toString(
          CryptoJS.enc.Hex,
      );

      sessionStorage.setItem(
          "registerPayload",
          JSON.stringify({email: email, password: hashPwd}),
      );

      feedback.info({
        title: "邮箱验证通过",
        description: "继续补充资料后即可完成注册。",
      });
      const registerSearchParams = new URLSearchParams();
      if (inviteCode) {
        registerSearchParams.set("invite_code", inviteCode);
      }
      const registerUrl = registerSearchParams.size > 0
          ? `/login/register?${registerSearchParams.toString()}`
          : "/login/register";
      router.push(registerUrl);
    } catch (error) {
      const message =
          error instanceof Error ? error.message : "验证码校验失败，请重试";
      setRegisterError(message);
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Loading) return;

    if (loginEmail.trim() === "" || loginPassword.trim() === "") {
      setLoginError("账号或密码不能为空");
      return;
    }

    if (loginPassword.trim().length < 4) {
      setLoginError("密码不能少于4位");
      return;
    }

    setLoginError("");
    const email = toCsuEmail(loginEmail.trim());
    const hashPwd = CryptoJS.SHA256(loginPassword).toString(CryptoJS.enc.Hex);

    setLoading(true);
    try {
      const result = await loginByEmail({
        email,
        password: hashPwd,
      });
      const data = result.data;
      login(data.access_token, data.refresh_token ?? null, data.user ?? null);
      feedback.success({
        title: "登录成功",
        description: "正在进入首页。",
      });
      setLoading(false);
      router.replace("/home");
    } catch (error) {
      const errorMsg =
          error instanceof Error ? error.message : "登录失败，请稍后再试";
      setLoginError(errorMsg);
      setLoading(false);
      return;
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/home");
  };

  return (
      <div className={styles["login-form"]}>
        <button
            type="button"
            onClick={handleBack}
            aria-label="返回上一页"
            className="absolute left-5 top-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/75 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <i className="uil uil-arrow-left text-base"/>
        </button>
        <div className={`${styles.container} ${isActive ? styles.active : ""}`}>
          {/* 登录 */}
          <div className={`${styles["form-box"]} ${styles.login}`}>
            <form onSubmit={handleLoginSubmit}>
              <h1>Login</h1>

              <div className={styles["input-box"]}>
                <input
                    type="text"
                    placeholder="email"
                    required
                    onChange={(e) => setLoginEmail(e.target.value)}
                    value={loginEmail}
                />
                <span
                    className="absolute right-3 top-[50%] -translate-y-1/2 border-l border-gray-400 pl-3 text-md text-gray-600 bg-gray-100">
                @csu.edu.cn
              </span>
              </div>

              <div className={styles["input-box"]}>
                <input
                    type={showLoginPwd ? "text" : "password"}
                    placeholder="password"
                    required
                    onChange={(e) => setLoginPassword(e.target.value)}
                    value={loginPassword}
                />
                <button
                    type="button"
                    className={styles["eye-btn"]}
                    onClick={() => setShowLoginPwd((v) => !v)}
                    aria-label={showLoginPwd ? "隐藏密码" : "显示密码"}
                >
                  <i
                      className={showLoginPwd ? "uil uil-eye" : "uil uil-eye-slash"}
                  />
                </button>
              </div>

              <div className={styles["forgot-link"]}>
                <Link href="/login/forget" className={styles["forgot-tip-link"]}>
                  Forgot password?
                </Link>
              </div>

              {loginError === "" ? null : (
                  <div className="text-red-500">{loginError}</div>
              )}

              <button
                  className={styles.btn}
                  type="submit"
                  style={
                    Loading ? {pointerEvents: "none", opacity: 0.6} : undefined
                  }
                  disabled={Loading}
              >
                {!Loading ? <span>Login</span> : <span>Loading</span>}
              </button>

              <p>or login with social platforms</p>

              <div className={styles["social-icons"]}>
                {/* 暂时注释 QQ 登录
                <button
                    type="button"
                    onClick={() => handleOAuthLogin("qq")}
                    aria-label="使用 QQ 登录"
                >
                  <FaSvgIcon name="qq"/>
                </button>
                */}
                <button
                    type="button"
                    onClick={() => handleOAuthLogin("github")}
                    aria-label="使用 GitHub 登录"
                >
                  <FaSvgIcon name="github"/>
                </button>
                {/* 暂时注释 Google 登录
                <button
                    type="button"
                    onClick={() => handleOAuthLogin("google")}
                    aria-label="使用 Google 登录"
                >
                  <FaSvgIcon name="google"/>
                </button>
                */}
              </div>
            </form>
          </div>

          {/* 注册 */}
          <div className={`${styles["form-box"]} ${styles.register}`}>
            <form onSubmit={handleRegisterSubmit}>
              <h1>Register</h1>
              {/*  /!* <div className={styles["input-box"]}>*/}
              {/*  <input type="text" placeholder="username" required />*/}
              {/*  <i className="uil uil-user" />*/}
              {/*</div> *!/*/}

              <div className={styles["input-box"]}>
                <input
                    type="text"
                    placeholder="csu email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                />
                <span
                    className="absolute right-3 top-[50%] -translate-y-1/2 border-l border-gray-400 pl-3 text-md text-gray-600 bg-gray-100">
                @csu.edu.cn
              </span>
              </div>

              <div className={styles["input-box"]}>
                <input
                    type={showRegisterPwd ? "text" : "password"}
                    placeholder="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                />
                <button
                    type="button"
                    className={styles["eye-btn"]}
                    onClick={() => setShowRegisterPwd((v) => !v)}
                    aria-label={showRegisterPwd ? "隐藏密码" : "显示密码"}
                >
                  <i
                      className={
                        showRegisterPwd ? "uil uil-eye" : "uil uil-eye-slash"
                      }
                  />
                </button>
              </div>
              <div className={styles["input-box"]}>
                <input
                    type="text"
                    placeholder="check code"
                    style={{paddingRight: "70px"}}
                    value={registerCode}
                    onChange={(e) => setRegisterCode(e.target.value)}
                    required
                />
                <button
                    type="button"
                    className={styles["send-code-btn"]}
                    onClick={handleSendCode}
                    disabled={countdown > 0 || isSendingCode}
                >
                  {isSendingCode
                      ? "..."
                      : countdown > 0
                          ? `${countdown}`
                          : "Send"}
                </button>
              </div>
              {registerError ? (
                  <p className="mb-2 text-sm text-red-500">{registerError}</p>
              ) : null}
              <button
                  className={styles.btn}
                  type="submit"
                  disabled={isRegisterSubmitting}
              >
                Registration
              </button>

              <p className={styles["email-tip"]}>
                Have any questions?
                <a
                    href="https://www.yuque.com/yuqueyonghu-kumqgh/invqh6/xcuxhmgmt19pmrd5?singleDoc#"
                    className={styles["email-tip-link"]}
                >
                  Solve problems
                </a>
              </p>
              <div className={styles["social-icons"]}>
                {/* 暂时注释 QQ 登录
                <button
                    type="button"
                    onClick={() => handleOAuthLogin("qq")}
                    aria-label="使用 QQ 登录"
                >
                  <FaSvgIcon name="qq"/>
                </button>
                */}
                <button
                    type="button"
                    onClick={() => handleOAuthLogin("github")}
                    aria-label="使用 GitHub 登录"
                >
                  <FaSvgIcon name="github"/>
                </button>
                {/* 暂时注释 Google 登录
                <button
                    type="button"
                    onClick={() => handleOAuthLogin("google")}
                    aria-label="使用 Google 登录"
                >
                  <FaSvgIcon name="google"/>
                </button>
                */}
              </div>
            </form>
          </div>

          {/* toggle-box */}
          <div className={styles["toggle-box"]}>
            <div className={`${styles["toggle-panel"]} ${styles["toggle-left"]}`}>
              <h1>CSU Star</h1>
              <p>Don&apos;t have an account?</p>
              <button
                  className={`${styles.btn} ${styles["register-b"]}`}
                  onClick={() => setIsActive(true)}
              >
                Register
              </button>
            </div>
            <div
                className={`${styles["toggle-panel"]} ${styles["toggle-right"]}`}
            >
              <h1>Welcome Back</h1>
              <p>Already have an account?</p>
              <button
                  className={`${styles.btn} ${styles["login-b"]}`}
                  onClick={() => setIsActive(false)}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
