import SearchResultCard from "@/app/(features)/search/components/SearchResultCard";
import type {
  SearchCourseItem,
  SearchResourceCard,
  SearchTeacherItem,
  SearchUnifiedItem,
} from "@/types/search";

function renderTypedCard(
  type: "course" | "teacher" | "resource",
  item: SearchCourseItem | SearchTeacherItem | SearchResourceCard,
) {
  if (type === "course") {
    return <SearchResultCard type="course" item={item as SearchCourseItem} />;
  }

  if (type === "teacher") {
    return <SearchResultCard type="teacher" item={item as SearchTeacherItem} />;
  }

  return <SearchResultCard type="resource" item={item as SearchResourceCard} />;
}

function renderUnifiedCard(item: SearchUnifiedItem) {
  return renderTypedCard(item.type, item.item);
}

function getEntryKey(entry: SearchUnifiedItem) {
  const entityId =
    entry.type === "resource" ? entry.item.course_id : entry.item.id;

  return `${entry.type}-${entityId}`;
}

export default function SearchResultsGrid({
  items,
}: {
  items: SearchUnifiedItem[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((entry) => (
        <div key={getEntryKey(entry)}>
          {renderUnifiedCard(entry)}
        </div>
      ))}
    </div>
  );
}
