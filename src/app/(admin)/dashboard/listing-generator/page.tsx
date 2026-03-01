import ListingGenerator from "@/components/admin/ListingGenerator";

export default function ListingGeneratorPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold text-neutral-900 mb-2">
        AI Listing Generator
      </h1>
      <p className="font-sans text-sm text-neutral-500 mb-8">
        Generate product titles and descriptions for CN and EN markets using AI.
      </p>
      <ListingGenerator />
    </div>
  );
}
