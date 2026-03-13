import { FAQEntry } from '@/lib/faqData';
import { FAQCard } from '@/components/FAQCard';
import { formatThaiDate } from '@/lib/faqData';

interface FAQTimelineProps {
  entries: FAQEntry[];
  onDocumentVote: (documentId: string, voteType: 'like' | 'dislike') => void;
  userVotes: Record<string, 'like' | 'dislike'>;
}

export function FAQTimeline({ entries, onDocumentVote, userVotes }: FAQTimelineProps) {
  // Group entries by date
  const groupedByDate = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, FAQEntry[]>);

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg">ไม่พบข้อมูลที่ตรงกับการค้นหา</p>
        <p className="text-muted-foreground text-sm mt-2">ลองปรับเงื่อนไขการค้นหาหรือ Tag ใหม่</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-blue-600" />

      {/* Timeline entries */}
      <div className="space-y-12">
        {sortedDates.map(date => (
          <div key={date}>
            {/* Date header */}
            <div className="relative mb-6 ml-20">
              <div className="absolute -left-16 top-1 w-4 h-4 rounded-full bg-teal-500 border-4 border-background shadow-lg" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-foreground">
                    {formatThaiDate(date)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {groupedByDate[date][0].dayOfWeek}
                  </p>
                </div>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {groupedByDate[date].length} คำถาม
                </span>
              </div>
            </div>

            {/* Entries for this date */}
            <div className="ml-20 space-y-4">
              {groupedByDate[date].map((entry, index) => (
                <FAQCard
                  key={entry.id}
                  entry={entry}
                  onDocumentVote={onDocumentVote}
                  userVotes={userVotes}
                  isLast={index === groupedByDate[date].length - 1 && date === sortedDates[sortedDates.length - 1]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
