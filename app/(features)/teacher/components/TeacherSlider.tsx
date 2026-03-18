/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import "./style.css";

export default function TeacherSlider() {
  return (
    <>
      <div className="teacher-slider-container w-full h-80 md:h-80 grid grid-cols-1 md:grid-cols-[3fr_2fr]">
        <div className="teacher-slider flex justify-center items-center flex-col">
          <div className="box h-80 md:h-80">
            <div className="item">
              <img
                src="https://faculty.csu.edu.cn/_resources/group1/M00/00/54/wKiylWC45E-ARoxPAAG4z1RcRIk044.png"
                alt=""
              />
            </div>
            <div className="item">
              <img
                src="https://faculty.csu.edu.cn/_resources/group1/M00/00/99/wKiylmgA5V-AJJFQAAE0GYrkKZU007.png"
                alt=""
              />
            </div>
            <div className="item">
              <img
                src="https://faculty.csu.edu.cn/_resources/group1/M00/00/93/wKiylWcdN0KAPhlWAAF8t3noEY0389.png"
                alt=""
              />
            </div>
            <div className="item">
              <img
                src="https://faculty.csu.edu.cn/_resources/group1/M00/00/69/wKiylWJPi12AAlsZAALJVtHOhL4238.png"
                alt=""
              />
            </div>
            <div className="item">
              <img
                src="https://faculty.csu.edu.cn/_resources/group1/M00/00/A7/wKiylWl6-piAUKgbAANTgmiwqWo988.png"
                alt=""
              />
            </div>
            <div className="item pc-only">
              <img
                src="https://faculty.csu.edu.cn/_resources/group1/M00/00/99/wKiylmgA5V-AJJFQAAE0GYrkKZU007.png"
                alt=""
              />
            </div>
            <div className="item pc-only">
              <img
                src="https://faculty.csu.edu.cn/_resources/group1/M00/00/93/wKiylWcdN0KAPhlWAAF8t3noEY0389.png"
                alt=""
              />
            </div>

            {/* <div className="buttons">
              <span className="back"></span>
              <span className="next"></span>
            </div> */}
          </div>
        </div>

        <div className="teacher-introduce-container">
          <div className="inline-flex flex-col justify-around h-full">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">
              Teacher Introduction
            </h1>

            <div className="detail">
              <p className="name">陈一鑫</p>
              <p className="title">特聘副教授</p>
              <p className="position">博士生导师</p>
              <p className="department">计算机学院</p>
            </div>

            <div className="teacher-links flex gap-10">
              <Link
                href="/home"
                className="flex justify-center button button--flex shadow-lg group w-auto"
              >
                当前教师详情
                <i className="uil uil-message button__icon ml-1 transition-transform duration-300 group-hover:translate-x-3" />
              </Link>

              <Link
                href="/home"
                className="flex justify-center text-first text-[700] items-center"
              >
                <span>查看全部教师</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
