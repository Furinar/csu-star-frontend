/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";

export default function Me() {
  return (
    <>
      <div className="container">
        <div className="mt-10 grid grid-cols-[1fr_2fr]">
          <div className="profile flex flex-col items-start bg-sky-100">
            <div className="avatar">
              <img
                className=" w-64 h-64 rounded-full mb-4 border-3 border-gray-200"
                src="/furina.jpg"
                alt=""
              />
            </div>

            <div className="info">
              <h1 className="text-2xl font-bold">Username</h1>

              <div className="bg-gray-300 text-center ">编辑个人资料</div>

              <div className="detail-info">
                <div>email</div>
                <div>department</div>
                <div>grade</div>
              </div>
            </div>
          </div>

          <div className="">
            <div>
              <div>积分余额: 999</div>
              <div>每日签到</div>
            </div>

            <div className="setting">
              <div>我的喜欢</div>
              <div>我的收藏</div>
              <div>我的资源</div>
              <div>我的教师评价</div>
              <div>我的课程评价</div>
              <div>意见反馈</div>
              <div>举报</div>
              <div>纠错</div>
              <div>积分流水</div>
              <div>分享邀请码</div>
              <div>绑定校园邮箱</div>
              <div>绑定第三方账号</div>
              <div>修改密码</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
