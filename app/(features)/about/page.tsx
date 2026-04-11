import styles from "./about.module.css";
import SponsorButton from "./components/SponsorButton";

type Member = {
  name: string;
  avatar: string;
  title: string;
  location: string;
  website?: string;
  email?: string;
  bio?: string;
  github?: string;
};

const CORE_MEMBERS: Member[] = [
  {
    name: "Furina",
    avatar: "https://img.cdn1.vip/i/69da3249c4d89_1775907401.webp",
    title: "前端工程师",
    location: "Jiangxi, China",
    website: "https://github.com/Furinar",
    github: "https://github.com/Furinar",
  },
  {
    name: "starnighter",
    avatar: "https://img.cdn1.vip/i/69da32882c772_1775907464.webp",
    title: "后端工程师",
    location: "Changsha, China",
    website: "https://blog.starnighter.com",
    github: "https://github.com/starnighter",
  },
  {
    name: "Qichen",
    avatar: "https://img.cdn1.vip/i/69da32882a9c5_1775907464.webp",
    title: "后端工程师",
    location: "蒙德, 提瓦特",
    website: "https://github.com/QiChenSn",
    github: "https://github.com/QiChenSn",
  },
  {
    name: "Navy_",
    avatar: "https://img.cdn1.vip/i/69da2d10ac1cf_1775906064.webp",
    title: "数据 测试",
    location: "Changsha, China",
    website: "https://skina.cn",
    github: "https://github.com/IAMNAVY",
  },
  {
    name: "GPT-5.4",
    avatar:
        "https://ts4.tc.mm.bing.net/th/id/OIP-C.9nB0y8FIZ156Iw0csey9NQAAAA?w=108&h=108&c=1&bgcl=1c8c09&r=0&o=7&dpr=2&pid=ImgRC&rm=3",
    title: "Slave",
    location: "San Francisco, America",
    website: "https://openai.com",
    // github: "https://github.com/johnsoncodehk",
  },
  {
    name: "Opus 4.6",
    avatar:
        "https://tse1-mm.cn.bing.net/th/id/OIP-C.tkL5azZ9GmOlrDDWwO4mNQHaHa?w=166&h=180&c=7&r=0&o=7&dpr=2&pid=1.7&rm=3",
    title: "Slave",
    location: "San Francisco, America",
    website: "https://www.anthopic.com",
    // github: "https://github.com/antfu",
  },
  {
    name: "Gemini -3.1-pro",
    avatar:
        "https://tse1-mm.cn.bing.net/th/id/OIP-C.E3H2gQjtfhGQrETciRrlPAAAAA?w=115&h=128&c=7&r=0&o=7&dpr=2&pid=1.7&rm=3",
    title: "Slave",
    location: "San Francisco, America",
    website: "https://gemini.google.com",
  },
];

// const SPONSOR_MEMBERS = [
//   {}
// ];

const COMMUNITY_MEMBERS: Member[] = [
  {
    name: "雲",
    avatar: "https://img.cdn1.vip/i/69da2f7505776_1775906677.jpg",
    title: "Contributor",
    location: "Jiangxi, China",
    // website: "https://#",
    // github: "https://github.com/#",
  },
  {
    name: "冰寻卿",
    avatar: "https://img.cdn1.vip/i/69da30608564d_1775906912.webp",
    title: "Contributor",
    location: "Guangxi, China",
    website: "https://blog.bingx.page",
    // github: "https://github.com/#",
  },
  {
    name: "没本事的辣椒油",
    avatar: "https://img.cdn1.vip/i/69da312d3260c_1775907117.webp",
    bio: "数学资料相关（特别是数学专业）可以dd我",
    email: "97084588@qq.com",
    title: "热心小蜜蜂",
    location: "Changsha, China",
    // website: "#",
    // github: "https://github.com/#",
  }
];

function LocationIcon() {
  return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.descIcon}>
        <path
            d="M12 24c-.2 0-.4-.1-.6-.2C11.1 23.6 2 17.4 2 10 2 4.5 6.5 0 12 0s10 4.5 10 10c0 7.4-9.1 13.6-9.4 13.8-.2.1-.4.2-.6.2zm0-22C7.6 2 4 5.6 4 10c0 5.4 6.1 10.4 8 11.8 1.9-1.4 8-6.4 8-11.8 0-4.4-3.6-8-8-8z"/>
        <path
            d="M12 14c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
  );
}

function WebsiteIcon() {
  return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.descIcon}>
        <path
            d="M14 16c-1.8 0-3.6-.8-4.8-2.4-.3-.4-.2-1.1.2-1.4.4-.3 1.1-.2 1.4.2 1.3 1.8 3.8 2.1 5.6.8.2-.1.3-.2.4-.4l3-3c1.5-1.6 1.5-4.1-.1-5.6-1.6-1.5-4-1.5-5.6 0l-1.7 1.7c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.7-1.7c2.3-2.3 6-2.3 8.3 0 2.4 2.3 2.4 6.1.1 8.5l-3 3c-.2.2-.4.4-.7.6-1.1.7-2.3 1.1-3.6 1.1z"/>
        <path
            d="M7.1 22.9c-1.5 0-3-.6-4.2-1.7-2.4-2.3-2.4-6.1-.1-8.5l3-3c.2-.1.4-.3.6-.5 1.3-1 2.9-1.4 4.4-1.1 1.6.2 3 1.1 3.9 2.3.3.4.2 1.1-.2 1.4-.4.3-1.1.2-1.4-.2-.6-.9-1.6-1.4-2.6-1.6-1.1-.2-2.1.1-3 .8-.2.1-.3.2-.4.4l-3 3c-1.5 1.6-1.5 4.1.1 5.6 1.6 1.5 4 1.5 5.6 0l1.7-1.7c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-1.7 1.7c-1.1 1.1-2.6 1.7-4.1 1.7z"/>
      </svg>
  );
}

function EmailIcon() {
  return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.descIcon}>
        <path
            d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.2l9 5.4 9-5.4V7H3zm18 10V9.5l-8.5 5.1a1 1 0 0 1-1 0L3 9.5V17h18z"/>
      </svg>
  );
}

function BioIcon() {
  return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.descIcon}>
        <path
            d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5zm3 2h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
      </svg>
  );
}

function GithubIcon() {
  return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.socialIcon}>
        <path
            d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
  );
}

function GithubEntryButton() {
  return (
      <a
          className={styles.githubEntry}
          href="https://github.com/Furinar/CSU-Star"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          title="GitHub"
      >
        <svg
            className={styles.githubEntryIcon}
            viewBox="0 0 496 512"
            height="1.4em"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
          <path
              d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/>
        </svg>
        <span className={styles.githubEntryText}>Github</span>
      </a>
  );
}

function TeamMemberCard({member}: { member: Member }) {
  return (
      <div className={styles.member}>
        <article className={styles.teamMember}>
          {member.github ? (
              <a
                  className={styles.githubTopRight}
                  href={member.github}
                  target="_blank"
                  rel="noreferrer"
              >
                <GithubIcon/>
              </a>
          ) : null}

          <figure className={styles.avatar}>
            <img
                className={styles.avatarImg}
                src={member.avatar}
                alt={`${member.name}'s Profile Picture`}
            />
          </figure>

          <div className={styles.data}>
            <h3 className={styles.name}>{member.name}</h3>
            <p className={styles.org}>{member.title}</p>
            {member.bio ? (
                <div className={styles.bioRow}>
                  <div className={styles.descTitle}>
                    <h4 className={styles.srOnly}>Bio</h4>
                    <BioIcon/>
                  </div>
                  <p className={styles.bio}>{member.bio}</p>
                </div>
            ) : null}

            <div className={styles.profiles}>
              <section className={styles.desc}>
                <div className={styles.descTitle}>
                  <h4 className={styles.srOnly}>Location</h4>
                  <LocationIcon/>
                </div>
                <ul className={styles.descList}>
                  <li className={styles.descItem}>{member.location}</li>
                </ul>
              </section>

              {member.website ? (
                  <section className={styles.desc}>
                    <div className={styles.descTitle}>
                      <h4 className={styles.srOnly}>Website</h4>
                      <WebsiteIcon/>
                    </div>
                    <p className={styles.descText}>
                      <a
                          className={styles.descLink}
                          href={member.website}
                          target="_blank"
                          rel="noreferrer"
                      >
                        {member.website.replace(/^https?:\/\//, "")}
                      </a>
                    </p>
                  </section>
              ) : null}

              {member.email ? (
                  <section className={styles.desc}>
                    <div className={styles.descTitle}>
                      <h4 className={styles.srOnly}>Email</h4>
                      <EmailIcon/>
                    </div>
                    <p className={styles.descText}>
                      <a className={styles.descLink} href={`mailto:${member.email}`}>
                        {member.email}
                      </a>
                    </p>
                  </section>
              ) : null}
            </div>
          </div>
        </article>
      </div>
  );
}

export default function AboutPage() {
  return (
      <div className={styles.page}>
        <div className={styles.teamPage}>
          <div className={styles.teamHero}>
            <div className={styles.container}>
              <div className={styles.heroHeader}>
                <h1 className={styles.title}>关于我们</h1>
                <GithubEntryButton/>
              </div>
              <strong>Make CSU Great Again</strong>
              <p className={styles.lead}>
                欢迎来到 CSU Star | 中站大学一站式综合平台 <br/>
                我们致力于为中南学子提供一个开放、透明、公平的评教平台 <br/>
                旨在实现知识平权、打破信息差 <br/>
              </p>
              <SponsorButton/>

              <p className={styles.lead}>
                <a
                    className={styles.link}
                    href="https://github.com/vuejs/governance/blob/master/Team-Charter.md"
                    target="_blank"
                    rel="noreferrer"
                ></a>
              </p>
            </div>
          </div>

          <section className={styles.teamList}>
            <div className={styles.container}>
              <div className={styles.teamGrid}>
                <div className={styles.info}>
                  <h2 className={styles.title}>核心开发成员</h2>
                  <p className={styles.lead}>
                    Core team members are those who are actively involved in the
                    maintenance of one or more core projects. They have made
                    significant contributions to the CSU Star ecosystem, with a
                    long term commitment to the success of the project and its
                    users.
                  </p>
                </div>
                <div className={styles.members}>
                  {CORE_MEMBERS.map((member) => (
                      <TeamMemberCard key={member.name} member={member}/>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.teamList}>
            <div className={styles.container}>
              <div className={styles.teamGrid}>
                <div className={styles.info}>
                  <h2 className={styles.title}>赞助成员</h2>
                  <p className={styles.lead}>
                    Here we express our sincere gratitude to our sponsor members
                    who have provided valuable support for the development of the
                    project.
                  </p>
                </div>
                <div className={styles.members}>
                  {/*{SPONSOR_MEMBERS.map((member) => (*/}
                  {/*    <TeamMemberCard key={member.name} member={member}/>*/}
                  {/*))}*/}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.teamList}>
            <div className={styles.container}>
              <div className={styles.teamGrid}>
                <div className={styles.info}>
                  <h2 className={styles.title}>合作伙伴</h2>
                  <p className={styles.lead}>
                    Some members of the CSU Star community have so enriched it,
                    that they deserve special mention. We&apos;ve developed a more
                    intimate relationship with these key partners, often
                    coordinating with them on upcoming features and news.
                  </p>
                </div>
                <div className={styles.members}>
                  {COMMUNITY_MEMBERS.map((member) => (
                      <TeamMemberCard key={member.name} member={member}/>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <p className={styles.footerText}>
              Released under the{" "}
              <a
                  className={styles.link}
                  href="https://opensource.org/licenses/MIT"
                  target="_blank"
                  rel="noreferrer"
              >
                MIT License
              </a>
              .
            </p>
            {/*<p className={styles.footerText}>Copyright © 2014-2026 Evan You</p>*/}
          </div>
        </footer>
      </div>
  );
}
