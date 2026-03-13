import { useState } from 'react';
import { FAQEntry, CATEGORIES } from '@/lib/faqData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText, Image } from 'lucide-react';
import { DocumentPreview } from '@/components/DocumentPreview';

interface FAQCardProps {
  entry: FAQEntry;
  onDocumentVote: (documentId: string, voteType: 'like' | 'dislike') => void;
  userVotes: Record<string, 'like' | 'dislike'>;
  isLast?: boolean;
}

export function FAQCard({ entry, onDocumentVote, userVotes, isLast }: FAQCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(entry.documents[0] || null);

  const categoryInfo = CATEGORIES[entry.category];

  return (
    <Card className="overflow-hidden border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
      <div
        className="p-5 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Category badge */}
            <div className="mb-2">
              <Badge className={`${categoryInfo.color} text-xs font-medium`}>
                {categoryInfo.icon} {categoryInfo.category}
              </Badge>
            </div>

            {/* Question */}
            <h3 className="text-base font-semibold text-foreground leading-tight pr-2">
              {entry.question}
            </h3>

            {/* Metadata */}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
              <span>ถาม: {entry.asker}</span>
              <span>•</span>
              <span>ตอบ: {entry.responder}</span>
              {entry.documents.length > 0 && (
                <>
                  <span>•</span>
                  <span>{entry.documents.length} เอกสาร</span>
                </>
              )}
            </div>
          </div>

          {/* Expand button */}
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {entry.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Answer section */}
          <div className="p-5 bg-muted/30">
            <h4 className="font-semibold text-sm text-foreground mb-2">คำตอบ:</h4>
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {entry.answer}
            </div>
          </div>

          {/* Documents section */}
          {entry.documents.length > 0 && (
            <div className="p-5 border-t border-border">
              <h4 className="font-semibold text-sm text-foreground mb-4">เอกสารแนบ:</h4>

              {/* Document list and preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Document list */}
                <div className="lg:col-span-1 space-y-2">
                  {entry.documents.map(doc => (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDocument?.id === doc.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-border hover:border-teal-300 bg-background'
                      }`}
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <div className="flex items-center gap-2">
                        {doc.type === 'pdf' ? (
                          <FileText className="w-4 h-4 text-red-500" />
                        ) : (
                          <Image className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-xs font-medium text-foreground truncate flex-1">
                          {doc.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Document preview */}
                {selectedDocument && (
                  <div className="lg:col-span-2">
                    <DocumentPreview 
                      document={selectedDocument}
                      onVote={(voteType) => onDocumentVote(selectedDocument.id, voteType)}
                      userVote={userVotes[selectedDocument.id] || null}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
