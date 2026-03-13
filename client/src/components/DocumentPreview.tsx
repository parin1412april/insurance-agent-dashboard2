import { Document } from '@/lib/faqData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';

interface DocumentPreviewProps {
  document: Document;
  onVote?: (voteType: 'like' | 'dislike') => void;
  userVote?: 'like' | 'dislike' | null;
}

export function DocumentPreview({ document, onVote, userVote }: DocumentPreviewProps) {
  const isPDF = document.type === 'pdf';
  const isImage = document.type === 'image';

  return (
    <Card className="p-4 bg-muted/50">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-2">ตัวอย่างเอกสาร</h4>
          <p className="text-xs text-muted-foreground truncate">{document.name}</p>
        </div>

        {/* Preview */}
        <div className="bg-background rounded-lg border border-border overflow-hidden flex items-center justify-center" style={{ minHeight: '300px' }}>
          {isImage && (
            <img
              src={document.url}
              alt={document.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22%23999%22%3EImage not found%3C/text%3E%3C/svg%3E';
              }}
            />
          )}
          {isPDF && (
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm text-muted-foreground">PDF Document</p>
              <p className="text-xs text-muted-foreground mt-1">คลิก "Open" เพื่อดูเอกสาร</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
          >
            <a href={document.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
          >
            <a href={document.url} download={document.name}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>

        {/* User Opinion */}
        <div className="text-xs text-muted-foreground bg-background p-3 rounded border border-border">
          <p className="font-medium mb-2 text-foreground">ความเห็นของผู้ใช้:</p>
          <p className="mb-3">👍 {document.likes} คนเห็นด้วย | 👎 {document.dislikes} คนไม่เห็นด้วย</p>
          
          {/* Like/Dislike Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 h-8 ${
                userVote === 'like'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300'
                  : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onVote?.('like');
              }}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              เห็นด้วย
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 h-8 ${
                userVote === 'dislike'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300'
                  : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onVote?.('dislike');
              }}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              ไม่เห็นด้วย
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
