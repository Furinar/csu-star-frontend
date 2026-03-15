"use client";

import { useState } from "react";
import styles from "./style.module.css";

export default function Login() {
  const [isActive, setIsActive] = useState(false);

  // 阻止默认刷新行为
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 这里未来可以调用登录/注册API
  };

  return (
    <div className={styles["login-form"]}>
      <div className={`${styles.container} ${isActive ? styles.active : ""}`}>
        {/* 登录 */}
        <div className={`${styles["form-box"]} ${styles.login}`}>
          <form onSubmit={handleSubmit}>
            <h1>Login</h1>

            <div className={styles["input-box"]}>
              <input type="text" placeholder="email" required />
              <i className="uil uil-envelope" />
            </div>

            <div className={styles["input-box"]}>
              <input type="password" placeholder="password" required />
              <i className="uil uil-lock" />
            </div>

            <div className={styles["forgot-link"]}>
              <a href="#">Forgot password?</a>
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
          <form onSubmit={handleSubmit}>
            <h1>Register</h1>

            <div className={styles["input-box"]}>
              <input type="text" placeholder="username" required />
              <i className="uil uil-user" />
            </div>

            <div className={styles["input-box"]}>
              <input type="text" placeholder="csu email" required />
              <i className="uil uil-envelope" />
            </div>

            <div className={styles["input-box"]}>
              <input type="password" placeholder="password" required />
              <i className="uil uil-lock" />
            </div>

            <button className={styles.btn} type="submit">
              Registration
            </button>

            <p>or register with social platforms</p>

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
