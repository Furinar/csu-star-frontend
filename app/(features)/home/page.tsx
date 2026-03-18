import SearchBar from "@/components/ui/SearchBar";

// SSG：纯静态页面，构建时生成
export const dynamic = "force-static";

export default function Home() {
  return (
    <>
      <div className="container flex flex-col gap-10 mt-10">
        <div>
          <SearchBar placeholder="Explore Everything" />
        </div>
      </div>
    </>
  );
}
