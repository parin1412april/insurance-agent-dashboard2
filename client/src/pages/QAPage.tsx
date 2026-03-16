import { useMemo, useRef } from 'react';
import { useFAQState } from '@/hooks/useFAQState';
import { searchFAQEntries, filterByTags, filterByCategory, FAQ_ENTRIES, CATEGORIES, getAllTags } from '@/lib/faqData';
import { FAQSearchBar } from '@/components/FAQSearchBar';
import { FAQTimeline } from '@/components/FAQTimeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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

  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter entries based on search and tags
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (searchQuery) result = searchFAQEntries(searchQuery, result);
    result = filterByTags(result, selectedTags);
    result = filterByCategory(result, selectedCategory);
    return result;
  }, [entries, searchQuery, selectedTags, selectedCategory]);

  const hasActiveFilters = selectedCategory !== 'all' || selectedTags.length > 0;
  const allTags = useMemo(() => getAllTags(), []);

  return (
    <div className="flex flex-col h-full -mx-4 -mt-4">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 pt-4 pb-3">
        {/* Title row */}
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-xl font-bold text-foreground">
            🏠 912 HelpHub Q&amp;A
          </h1>
          <span className="hidden sm:inline-block text-xs bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 px-2 py-1 rounded-full font-medium">
            ฐานข้อมูลทีมประกัน
          </span>
        </div>

        {/* Search bar */}
        <FAQSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        {/* Category filter row */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 h-7 text-xs px-3"
            onClick={() => setSelectedCategory('all')}
          >
            📌 ทั้งหมด
          </Button>
          {Object.entries(CATEGORIES).map(([key, category]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 h-7 text-xs px-3"
              onClick={() => setSelectedCategory(key)}
            >
              {category.icon} {category.category}
            </Button>
          ))}
        </div>

        {/* Tag filter row */}
        <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
              className="cursor-pointer shrink-0 hover:opacity-80 transition-opacity text-xs"
              onClick={() => toggleTag(tag)}
            >
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Results info + clear */}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            พบ <span className="font-semibold text-foreground">{filteredEntries.length}</span> รายการ
            จากทั้งหมด <span className="font-semibold text-foreground">{FAQ_ENTRIES.length}</span> คำถาม-คำตอบ
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
              onClick={clearFilters}
            >
              <X className="w-3 h-3 mr-1" />
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable content — use -webkit-overflow-scrolling for smooth iPad scroll */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <FAQTimeline
          entries={filteredEntries}
          onDocumentVote={handleVote}
          userVotes={votes}
        />

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
                จำนวนคำถาม: {FAQ_ENTRIES.length} รายการ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
