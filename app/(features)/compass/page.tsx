import GlassCard from "@/components/ui/GlassCard";

export default function Compass() {

  return (
      <>
        <div className="container flex flex-col gap-10">
          <GlassCard className="pt-10 flex flex-col gap-20">
            <div className="flex justify-center items-center flex-col gap-3 w-full">
              <div className="hero-gradient-text text-4xl font-bold">
                中南大学生存指北
              </div>
              <div className="text-gray-600">
                Chart your course, thrive in CSU.
              </div>
            </div>

            <div className="pl-10">
              <div className="text-gray-800 font-bold text-2xl">
                <i className="uil uil-compass"></i>
                本页宗旨
              </div>

              <div className="pl-2 text-gray-600">
                <div>
                  <span>
                    <i className="uil uil-users-alt"></i>
                    目标人群：中南大学全体在读学生
                  </span>
                </div>

                <div>
                  <span>
                    <i className="uil uil-capture"></i>
                    目的:
                  </span>
                </div>

                <div>
                  <span>
                    贡献：
                  </span>
                </div>
              </div>
            </div>


          </GlassCard>
        </div>
      </>
  )
}