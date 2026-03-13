import { CATEGORIES, getAllTags } from '@/lib/faqData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FAQSidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
}

export function FAQSidebar({
  selectedCategory,
  onCategoryChange,
  selectedTags,
  onTagToggle,
  onClearFilters
}: FAQSidebarProps) {
  const allTags = getAllTags();
  const hasActiveFilters = selectedCategory !== 'all' || selectedTags.length > 0;

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm text-foreground mb-3">หมวดหมู่</h3>
        <div className="space-y-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start"
            onClick={() => onCategoryChange('all')}
          >
            📌 ทั้งหมด
          </Button>
          {Object.entries(CATEGORIES).map(([key, category]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => onCategoryChange(key)}
            >
              {category.icon} {category.category}
            </Button>
          ))}
        </div>
      </Card>

      {/* Tags */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground">Tag</h3>
          {selectedTags.length > 0 && (
            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full font-medium">
              {selectedTags.length}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onTagToggle(tag)}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onClearFilters}
        >
          <X className="w-4 h-4 mr-2" />
          ล้างตัวกรอง
        </Button>
      )}

      {/* Info */}
      <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
        <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          <span className="font-semibold">💡 เคล็ดลับ:</span> คลิกที่ Tag หรือหมวดหมู่เพื่อกรองข้อมูล หรือใช้ช่อง Search ด้านบนเพื่อค้นหาคำถาม-คำตอบ
        </p>
      </Card>
    </div>
  );
}
