import { useState, useEffect } from 'react';
import { FAQ_ENTRIES, FAQEntry, Document } from '@/lib/faqData';

interface VoteData {
  [documentId: string]: 'like' | 'dislike';
}

export function useFAQState() {
  const [entries, setEntries] = useState<FAQEntry[]>(FAQ_ENTRIES);
  const [votes, setVotes] = useState<VoteData>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load votes from localStorage on mount
  useEffect(() => {
    const savedVotes = localStorage.getItem('faq-votes');
    if (savedVotes) {
      try {
        setVotes(JSON.parse(savedVotes));
      } catch (e) {
        console.error('Failed to load votes from localStorage', e);
      }
    }
  }, []);

  // Save votes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('faq-votes', JSON.stringify(votes));
  }, [votes]);

  // Update document votes in entries
  useEffect(() => {
    const updatedEntries = entries.map(entry => ({
      ...entry,
      documents: entry.documents.map(doc => {
        const voteKey = doc.id;
        const userVote = votes[voteKey];
        return {
          ...doc,
          userVote: userVote || null
        };
      })
    }));
    setEntries(updatedEntries);
  }, [votes]);

  const handleVote = (documentId: string, voteType: 'like' | 'dislike') => {
    setVotes(prev => {
      const newVotes = { ...prev };
      if (newVotes[documentId] === voteType) {
        // Remove vote if clicking the same button
        delete newVotes[documentId];
      } else {
        // Add or change vote
        newVotes[documentId] = voteType;
      }
      return newVotes;
    });

    // Update the document count in entries
    setEntries(prev =>
      prev.map(entry => ({
        ...entry,
        documents: entry.documents.map(doc => {
          if (doc.id === documentId) {
            const oldVote = votes[documentId];
            let newLikes = doc.likes;
            let newDislikes = doc.dislikes;

            // Remove old vote
            if (oldVote === 'like') newLikes--;
            if (oldVote === 'dislike') newDislikes--;

            // Add new vote
            if (votes[documentId] !== voteType) {
              if (voteType === 'like') newLikes++;
              if (voteType === 'dislike') newDislikes++;
            }

            return { ...doc, likes: newLikes, dislikes: newDislikes };
          }
          return doc;
        })
      }))
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedCategory('all');
  };

  return {
    entries,
    votes,
    searchQuery,
    setSearchQuery,
    selectedTags,
    toggleTag,
    selectedCategory,
    setSelectedCategory,
    handleVote,
    clearFilters
  };
}
