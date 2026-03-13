import { useMemo, useState } from 'react';
import { useFAQState } from '@/hooks/useFAQState';
import { searchFAQEntries, filterByTags, filterByCategory, FAQ_ENTRIES } from '@/lib/faqData';
import { FAQSearchBar } from '@/components/FAQSearchBar';
import { FAQSidebar } from '@/components/FAQSidebar';
import { FAQTimeline } from '@/components/FAQTimeline';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function QAPage() {
  const {
    entries,
    votes,
    searchQuery,
    setSearchQuery,
    selectedTags,
    toggleTag,
    selectedCategory,
    setSelectedCategory,
    handleVote,
    clearFilters,
  } = useFAQState();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter entries based on search and tags
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (searchQuery) {
      result = searchFAQEntries(searchQuery, result);
    }

    result = filterByTags(result, selectedTags);
    result = filterByCategory(result, selectedCategory);

    return result;
  }, [entries, searchQuery, selectedTags, selectedCategory]);

  return (
    <div className="flex flex-col h-full -mx-4 -mt-4">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">
              🏠 912 HelpHub Q&amp;A
            </h1>
            <span className="hidden sm:inline-block text-xs bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 px-2 py-1 rounded-full font-medium">
              ฐานข้อมูลทีมประกัน
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <FAQSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        {/* Results info */}
        <div className="mt-2 text-xs text-muted-foreground">
          พบ <span className="font-semibold text-foreground">{filteredEntries.length}</span> รายการ
          จากทั้งหมด <span className="font-semibold text-foreground">{FAQ_ENTRIES.length}</span> คำถาม-คำตอบ
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-4">
              <FAQSidebar
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedTags={selectedTags}
                onTagToggle={toggleTag}
                onClearFilters={clearFilters}
              />
            </div>
          </aside>

          {/* Sidebar - Mobile */}
          {sidebarOpen && (
            <aside className="lg:hidden col-span-1 mb-4">
              <FAQSidebar
                selectedCategory={selectedCategory}
                onCategoryChange={(cat) => {
                  setSelectedCategory(cat);
                  setSidebarOpen(false);
                }}
                selectedTags={selectedTags}
                onTagToggle={(tag) => {
                  toggleTag(tag);
                }}
                onClearFilters={() => {
                  clearFilters();
                  setSidebarOpen(false);
                }}
              />
            </aside>
          )}

          {/* Timeline */}
          <main className="lg:col-span-3">
            <FAQTimeline
              entries={filteredEntries}
              onDocumentVote={handleVote}
              userVotes={votes}
            />
          </main>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-foreground mb-1">เกี่ยวกับ</h4>
              <p className="text-muted-foreground text-xs">
                ฐานข้อมูล Q&A สำหรับทีมตัวแทนประกัน 912 HelpHub ช่วยให้ค้นหาและแบ่งปันความรู้ได้อย่างรวดเร็ว
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">ช่องทางติดต่อ</h4>
              <p className="text-muted-foreground text-xs">
                📞 AIA Agent Hotline: 02-353-8888<br />
                📞 Claim Expert: 02-353-8809
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">ข้อมูลเพิ่มเติม</h4>
              <p className="text-muted-foreground text-xs">
                ช่วงเวลา: 3–9 มีนาคม 2569<br />
                จำนวนคำถาม: {FAQ_ENTRIES.length} รายการ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
