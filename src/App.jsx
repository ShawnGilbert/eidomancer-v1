import { starterPrompts } from "./data/starterPrompts";
import { useEidomancerStore } from "./hooks/useEidomancerStore";

import { QuestionPanel } from "./components/QuestionPanel";
import { RecentCastsPanel } from "./components/RecentCastsPanel";
import { ActiveCastCard } from "./components/ActiveCastCard";
import { PackageActionsPanel } from "./components/PackageActionsPanel";
import { GeneratedOutputsPanel } from "./components/GeneratedOutputsPanel";
import { TipJarFooter } from "./components/TipJarFooter";

export default function App() {
  const store = useEidomancerStore();

  return (
    <main className="min-h-screen bg-[#020b2a] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <QuestionPanel
            question={store.question}
            setQuestion={store.setQuestion}
            prompts={starterPrompts}
            onCast={store.castQuestion}
            onClear={store.clearQuestion}
            isCasting={store.isCasting}
          />

          <RecentCastsPanel
            casts={store.recentCasts}
            activeCastId={store.activeCast?.id}
            onLoadCast={store.loadCast}
          />
        </div>

        <div className="mt-6 space-y-6">
          <ActiveCastCard
            activeCast={store.activeCast}
            isCasting={store.isCasting}
          />

          {store.activeCast && (
            <>
              <PackageActionsPanel
                onGenerate={store.generateAsset}
                onGenerateAll={store.generateAllAssets}
                isGeneratingAsset={store.isGeneratingAsset}
              />

              <GeneratedOutputsPanel activeCast={store.activeCast} />
            </>
          )}

          {store.error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {store.error}
            </div>
          )}

          <TipJarFooter />
        </div>
      </div>
    </main>
  );
}