export default function ContactSection() {
  return (
    <section className="section" id="contact">
      <h2 className="section__title">联系我们</h2>
      <span className="section__subtitle">取得联系</span>
      <div className="container grid gap-y-12 min-[568px]:grid-cols-2">
        <div>
          <div className="flex mb-8">
            <i className="uil uil-envelope text-2xl text-first mr-3" />
            <div>
              <h3 className="text-(length:--h3-font-size) font-medium">邮箱</h3>
              <span className="text-(length:--small-font-size) text-text-light">csustar@csu.edu.cn</span>
            </div>
          </div>
          <div className="flex mb-8">
            <i className="uil uil-map-marker text-2xl text-first mr-3" />
            <div>
              <h3 className="text-(length:--h3-font-size) font-medium">地址</h3>
              <span className="text-(length:--small-font-size) text-text-light">湖南省长沙市 · 中南大学</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
