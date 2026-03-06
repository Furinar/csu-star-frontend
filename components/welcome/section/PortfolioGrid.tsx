import Image from "next/image";

const portfolioItems = [
  {
    title: "课程管理模块",
    desc: "覆盖全校 32 个学院的课程查询与选课功能",
    img: "/portfolio1.jpg",
  },
  {
    title: "校园资讯平台",
    desc: "实时聚合校内通知、讲座与活动信息",
    img: "/portfolio2.jpg",
  },
  {
    title: "个人中心",
    desc: "成绩查询、课表管理、个性化设置一站搞定",
    img: "/portfolio3.jpg",
  },
];

export default function PortfolioGrid() {
  return (
    <div className="container grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
      {portfolioItems.map((item) => (
        <div key={item.title} className="p-4 px-6">
          <Image
            src={item.img}
            alt={item.title}
            width={320}
            height={200}
            className="w-full h-auto rounded-lg justify-self-center"
          />
          <h3 className="text-(length:--h3-font-size) mb-2">{item.title}</h3>
          <p className="mb-3">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
