/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import "./style.css";
import RadarMap from "@/components/ui/RadarMap";

export default function TeacherSlider() {
  return (
    <>
      <div className="teacher-slider-container w-full h-90 md:h-90 grid grid-cols-1 md:grid-cols-[5fr_3fr] ">
        <div className="teacher-slider flex justify-center items-center flex-col">
          <div className="box h-90 md:h-90">
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
          <div className="inline-flex flex-col justify-evenly h-80">
            <h1 className="text-3xl md:text-3xl font-bold mt-5">
              Teacher Introduction
            </h1>

            <div className="flex items-center justify-between h-full">
              <RadarMap
                values={[4.01, 3.99, 2.98, 4.87]}
                indicator={[
                  { name: '教学质量', max: 5 },
                  { name: '考勤宽松', max: 5 },
                  { name: '给分宽松', max: 5 },
                  { name: '好评率', max: 5 }
                ]}
                width="200px"
                height="200px"
              />

              <div className="detail flex flex-col gap-2 items-end" >
                <p className="name hero-gradient-text text-2xl font-bold">陈一鑫</p>
                <div className="flex flex-col gap-0.5 items-end " >
                  <p className="title text-gray-600">原神冰之女皇</p>
                  <p className="position text-gray-600">博士生导师</p>
                  <p className="department text-gray-600">计算机学院</p>
                </div>
              </div>


            </div>

            <div className="teacher-links flex mb-2 justify-end">
              <Link
                href="/home"
                className="flex justify-center button button--flex shadow-lg group w-full "
              >
                查看全部教师
                <i className="uil uil-message button__icon ml-1 transition-transform duration-300 group-hover:translate-x-3" />
              </Link>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
