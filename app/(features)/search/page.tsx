import SearchBar from "@/components/ui/SearchBar";

export default function Search() {
  return (
    <>
      <div className="container flex flex-col gap-10 mt-10">
        <h1 className="text-3xl hero-">搜索</h1>
        <SearchBar placeholder="搜索资源、课程或教师..." />
      </div>
    </>
  );
}
