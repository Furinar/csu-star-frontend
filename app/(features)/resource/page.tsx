import SearchBar from "@/components/ui/SearchBar";
import UploadResource from "@/app/(features)/resource/components/UploadResource";

export default function Resource() {
  return (
    <>
      <div className="container flex flex-col gap-10 mt-10">
        <div>
          <SearchBar placeholder="Search Resource" />
        </div>

          <div>
              <UploadResource />
          </div>
      </div>
    </>
  );
}
