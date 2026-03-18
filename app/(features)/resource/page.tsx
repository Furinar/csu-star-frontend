import SearchBar from "@/components/ui/SearchBar";

export default function Resource() {
  return (
    <>
      <div className="container flex flex-col gap-10 mt-10">
        <div>
          <SearchBar placeholder="Search Resource" />
        </div>{" "}
      </div>
    </>
  );
}
