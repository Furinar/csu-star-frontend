"use client";

import { useState } from "react";
import styles from "./style.module.css";
import { useRouter } from "next/navigation";
import { sendRegisterCode, verifyRegisterCode } from "@/api/auth";
import ThemeToggleButton from "./components/ThemeToggleButton";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegisterPwd, setShowRegisterPwd] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerCode, setRegisterCode] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);

  const toCsuEmail = (value: string) => {
    if (value.endsWith("@csu.edu.cn")) return value;
    else return `${value.trim().toLowerCase()}@csu.edu.cn`;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      await sendRegisterCode(toCsuEmail(emailPrefix));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "验证码发送失败，请稍后重试";
      setRegisterError(message);
      setIsSendingCode(false);
      return;
    }

    setIsSendingCode(false);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

    setRegisterError("");
    setIsRegisterSubmitting(true);

    try {
      const email = toCsuEmail(registerEmail);
      const result = await verifyRegisterCode({
        email,
        code: registerCode.trim(),
      });

      const params = new URLSearchParams({ email });
      if (result?.registration_token) {
        params.set("registrationToken", result.registration_token);
      }

      router.push(`/login/register?${params.toString()}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "验证码校验失败，请重试";
      setRegisterError(message);
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  return (
    <div className={styles["login-form"]}>
      <ThemeToggleButton />

      <div className={`${styles.container} ${isActive ? styles.active : ""}`}>
        {/* 登录 */}
        <div className={`${styles["form-box"]} ${styles.login}`}>
          <form onSubmit={handleLoginSubmit}>
            <h1>Login</h1>

            <div className={styles["input-box"]}>
              <input type="text" placeholder="email" required />
              <span className="absolute right-3 top-[50%] -translate-y-1/2 border-l border-gray-400 pl-3 text-md text-gray-600">
                @csu.edu.cn
              </span>
            </div>

            <div className={styles["input-box"]}>
              <input
                type={showLoginPwd ? "text" : "password"}
                placeholder="password"
                required
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

            <button className={styles.btn} type="submit">
              Login
            </button>

            <p>or login with social platforms</p>

            <div className={styles["social-icons"]}>
              <a href="#">
                <i className="fa-brands fa-weixin"></i>
              </a>
              <a href="#">
                <i className="fa-brands fa-qq"></i>
              </a>
              <a href="#">
                <i className="fa-brands fa-github"></i>
              </a>
              <a href="#">
                <i className="fa-brands fa-google"></i>
              </a>
            </div>
          </form>
        </div>

        {/* 注册 */}
        <div className={`${styles["form-box"]} ${styles.register}`}>
          <form onSubmit={handleRegisterSubmit}>
            <h1>Register</h1>
            {/* <div className={styles["input-box"]}>
              <input type="text" placeholder="username" required />
              <i className="uil uil-user" />
            </div> */}

            <div className={styles["input-box"]}>
              <input
                type="text"
                placeholder="csu email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
              <span className="absolute right-3 top-[50%] -translate-y-1/2 border-l border-gray-400 pl-3 text-md text-gray-600">
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
                style={{ paddingRight: "70px" }}
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
              <a href="#">
                <i className="fa-brands fa-weixin"></i>
              </a>

              <a href="#">
                <i className="fa-brands fa-qq"></i>
              </a>
              <a href="#">
                <i className="fa-brands fa-github"></i>
              </a>
              <a href="#">
                <i className="fa-brands fa-google"></i>
              </a>
            </div>
          </form>
        </div>

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
