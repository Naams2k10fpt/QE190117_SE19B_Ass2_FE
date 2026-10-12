import { tagsApi } from "@/lib/api";
import { TagPill } from "@/components/Badge";

export default async function TagsPage() {
  const tags = await tagsApi.getAll();
  return <section className="space-y-6"><h1 className="text-3xl font-bold">Tags</h1>
    <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-6">{tags.map(tag => <TagPill key={tag.tagId} tag={tag} />)}{tags.length === 0 && <p className="text-slate-500">No tags.</p>}</div>
  </section>;
}
