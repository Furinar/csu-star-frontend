export default function HomeSection() {
  return (
    <section className="section" id="home">
      <div className="container">
        <div className="grid grid-cols-[1fr_1fr] pt-14 items-center md:pt-22 md:gap-x-8">
          {/* 左侧介绍区 */}
          <div>
            <h2 className="text-(length:--big-font-size)">南极星</h2>
            <h1 className="text-(length:--big-font-size)">EXPLORE CSU STAR</h1>
            <h3 className="text-(length:--h3-font-size) text-text font-medium mb-3">
              中南大学一站式综合平台
            </h3>
            <p className="mb-8 text-text">
              打破信息孤岛，连接校园资源，免费为中南大学师生提供便捷的数字化校园体验
            </p>
            <a href="/home" className="button button--flex">
              开始探索 <i className="uil uil-message button__icon" />
            </a>
          </div>

          {/* 右侧图像区 */}
          <div className="justify-self-center">
            <svg
              className="w-60 fill-first md:w-75 lg:w-90"
              viewBox="0 0 200 187"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="CSU Star Logo"
            >
              <mask id="mask0" mask-type="alpha">
                <path d="M190.312 36.4879C206.582 62.1187 201.309 102.826 182.328 134.186C163.346 165.547 130.807 187.559 100.226 186.353C69.6454 185.297 41.0228 161.023 21.7403 129.362C2.45775 97.8511 -7.48481 59.1033 6.67581 34.5279C20.9871 10.1032 59.7028 -0.149132 97.9666 0.00163737C136.23 0.303176 174.193 10.857 190.312 36.4879Z" />
              </mask>
              <g mask="url(#mask0)">
                <path d="M190.312 36.4879C206.582 62.1187 201.309 102.826 182.328 134.186C163.346 165.547 130.807 187.559 100.226 186.353C69.6454 185.297 41.0228 161.023 21.7403 129.362C2.45775 97.8511 -7.48481 59.1033 6.67581 34.5279C20.9871 10.1032 59.7028 -0.149132 97.9666 0.00163737C136.23 0.303176 174.193 10.857 190.312 36.4879Z" />
                <image className="w-55" x="12" y="18" href="/csustar.png" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
