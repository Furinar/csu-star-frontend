"use client";

import {useEffect, useState} from "react";
import styles from "./style.module.css";
import {useRouter, useSearchParams} from "next/navigation";
import {loginByEmail, sendCaptcha, verifyEmail,} from "@/api/auth";
import Link from "next/link";
import CryptoJS from "crypto-js";
import {useTimer} from "@/hooks/useTimer";
import {useAuthStore} from "@/store/useAuthStore";
import {feedback} from "@/store/useFeedbackStore";

type AuthPlatform = keyof typeof AUTH_CONFIG;
const OAUTH_CONTEXT_STORAGE_KEY = "oauth-context";

const AUTH_CONFIG = {
  qq: {
    url: "https://graph.qq.com/oauth2.0/authorize",
    client_id: process.env.NEXT_PUBLIC_QQ_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scope: "get_user_info",
    extraParams: {},
  },
  github: {
    url: "https://github.com/login/oauth/authorize",
    client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scope: "read:user user:email",
    extraParams: {
      allow_signup: "true",
    },
  },
  google: {
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    scope: "openid email profile",
    extraParams: {
      access_type: "offline",
      include_granted_scopes: "true",
      prompt: "consent",
    },
  },
};

type OAuthContext = {
  state: string;
  platform: AuthPlatform;
  codeChallenge: string;
};

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
  );
};

const createOAuthState = (platform: AuthPlatform) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${platform}:${crypto.randomUUID()}`;
  }

  return `${platform}:${Math.random().toString(36).substring(2, 15)}`;
};

const encodeBase64Url = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const createCodeChallenge = async () => {
  const verifier = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(verifier),
  );

  return encodeBase64Url(digest);
};

const buildAuthUrl = (
    platform: AuthPlatform,
    state: string,
    codeChallenge: string,
    isMobile: boolean,
) => {
  const config = AUTH_CONFIG[platform];
  const params = new URLSearchParams({
    client_id: config.client_id,
    redirect_uri: config.redirect_uri,
    scope: config.scope,
    response_type: "code",
    state: state,
  });

  Object.entries(config.extraParams).forEach(([key, value]) => {
    params.append(key, value);
  });

  if (platform !== "qq") {
    params.append("code_challenge", codeChallenge);
    params.append("code_challenge_method", "S256");
  }

  if (platform === "qq" && isMobile) {
    params.append("display", "mobile");
  }

  return `${config.url}?${params.toString()}`;
};

export default function Login() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const searchParams = useSearchParams()
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
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "true") {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [searchParams]);

  const toCsuEmail = (value: string) => {
    const prefix = value.split('@')[0].trim().toLowerCase();
    return `${prefix}@csu.edu.cn`;
  };

  const handleOAuthLogin = async (platform: AuthPlatform) => {
    const state = createOAuthState(platform);
    const codeChallenge = await createCodeChallenge();
    const context: OAuthContext = {state, platform, codeChallenge};
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
      await sendCaptcha(toCsuEmail(emailPrefix));
      feedback.success({
        title: "验证码已发送",
        description: `请查收 ${toCsuEmail(emailPrefix)} 的邮件。`,
      });
    } catch (error) {
      const message =
          error instanceof Error ? error.message : "验证码发送失败，请稍后重试";
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
      await verifyEmail(
          email, registerCode.trim()
      );

      const hashPwd = CryptoJS.SHA256(registerPassword).toString(
          CryptoJS.enc.Hex
      );

      sessionStorage.setItem(
          "registerPayload",
          JSON.stringify({email: email, password: hashPwd}),
      );

      feedback.info({
        title: "邮箱验证通过",
        description: "继续补充资料后即可完成注册。",
      });
      router.push(`/login/register`);
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

    if (Loading)
      return;

    if (loginEmail.trim() === "" || loginPassword.trim() === "") {
      setLoginError("账号或密码不能为空");
      return;
    }

    if (loginPassword.trim().length < 8) {
      setLoginError("密码不能少于8位");
      return;
    }

    setLoginError("");
    const email = toCsuEmail(loginEmail.trim());
    const hashPwd = CryptoJS.SHA256(loginPassword).toString(
        CryptoJS.enc.Hex
    );

    setLoading(true);
    try {
      const result = await loginByEmail({
        email,
        password: hashPwd
      })
      const data = result.data;
      login(data.access_token, data.refresh_token ?? null, data.user ?? null);
      feedback.success({
        title: "登录成功",
        description: "正在进入首页。",
      });
      setLoading(false);
      router.replace("/home");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "登录失败，请稍后再试";
      setLoginError(errorMsg);
      setLoading(false);
      return;
    }
  };

  return (
      <div className={styles["login-form"]}>
        <div className={`${styles.container} ${isActive ? styles.active : ""}`}>
          {/* 登录 */}
          <div className={`${styles["form-box"]} ${styles.login}`}>
            <form onSubmit={handleLoginSubmit}>
              <h1>Login</h1>

              <div className={styles["input-box"]}>
                <input type="text" placeholder="email" required onChange={e => setLoginEmail(e.target.value)}
                       value={loginEmail}/>
                <span
                    className="absolute right-3 top-[50%] -translate-y-1/2 border-l border-gray-400 pl-3 text-md text-gray-600">
                @csu.edu.cn
              </span>
              </div>

              <div className={styles["input-box"]}>
                <input
                    type={showLoginPwd ? "text" : "password"}
                    placeholder="password"
                    required
                    onChange={e => setLoginPassword(e.target.value)}
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

              {
                loginError === "" ? null : (
                    <div className="text-red-500">
                      {loginError}
                    </div>
                )
              }

              <button className={styles.btn} type="submit"
                      style={Loading ? {pointerEvents: 'none', opacity: 0.6} : undefined} disabled={Loading}>
                {
                  !Loading ? (<span>Login</span>) : (<span>Loading</span>)
                }
              </button>

              <p>or login with social platforms</p>

              <div className={styles["social-icons"]}>
                <button type="button" onClick={() => handleOAuthLogin("qq")} aria-label="使用 QQ 登录">
                  <i className="fa-brands fa-qq"></i>
                </button>
                <button type="button" onClick={() => handleOAuthLogin("github")} aria-label="使用 GitHub 登录">
                  <i className="fa-brands fa-github"></i>
                </button>
                <button type="button" onClick={() => handleOAuthLogin("google")} aria-label="使用 Google 登录">
                  <i className="fa-brands fa-google"></i>
                </button>
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
                    className="absolute right-3 top-[50%] -translate-y-1/2 border-l border-gray-400 pl-3 text-md text-gray-600">
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
                Don&apos;t have a CSU Email?
                <a
                    href="https://www.yuque.com/yuqueyonghu-kumqgh/invqh6/xcuxhmgmt19pmrd5?singleDoc#"
                    className={styles["email-tip-link"]}
                >
                  Get Email
                </a>
              </p>
              <div className={styles["social-icons"]}>
                <button type="button" onClick={() => handleOAuthLogin("qq")} aria-label="使用 QQ 登录">
                  <i className="fa-brands fa-qq"></i>
                </button>
                <button type="button" onClick={() => handleOAuthLogin("github")} aria-label="使用 GitHub 登录">
                  <i className="fa-brands fa-github"></i>
                </button>
                <button type="button" onClick={() => handleOAuthLogin("google")} aria-label="使用 Google 登录">
                  <i className="fa-brands fa-google"></i>
                </button>
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
