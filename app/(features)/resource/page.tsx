import UploadResource from "@/app/(features)/resource/components/UploadResource";
import SearchBar from "@/components/ui/SearchBar";

export default function Resource() {
  return (
      <>
        <div className="container flex flex-col gap-10 mt-10">
          <div>
            <SearchBar placeholder="搜索资源..."/>
          </div>

          <div>
            <UploadResource/>
          </div>
        </div>
      </>
  );
}
