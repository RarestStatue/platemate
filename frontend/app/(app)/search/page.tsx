import { Suspense } from "react";
import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-center text-muted">Loading...</div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
