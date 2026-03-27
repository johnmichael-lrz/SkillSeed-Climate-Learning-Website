import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { toggleSubmissionLike } from "../utils/challengeService";
import type { FeedItem } from "../types/database";

// Helper to get initials from name
function getInitials(name: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface FeedCardProps {
  item: FeedItem;
  isLiked: boolean;
  userId: string | null;
  onOpenChallenge?: (challengeId: string) => void;
  onLikeUpdate?: (submissionId: string, newCount: number, isLiked: boolean) => void;
}

export function FeedCard({ item, isLiked, userId, onOpenChallenge, onLikeUpdate }: FeedCardProps) {
  const [likeCount, setLikeCount] = useState(item.like_count);
  const [liked, setLiked] = useState(isLiked);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (!userId || liking) return;

    setLiking(true);
    const newLiked = !liked;
    const optimisticCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    // Optimistic update
    setLiked(newLiked);
    setLikeCount(optimisticCount);

    try {
      const newCount = await toggleSubmissionLike(item.id, userId);
      setLikeCount(newCount);
      onLikeUpdate?.(item.id, newCount, newLiked);
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setLikeCount(item.like_count);
      console.error("Error toggling like:", error);
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/challenges/${item.challenge_id}`;
    const shareText = `${item.user_name} completed the "${item.challenge_title}" challenge on SkillSeed!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SkillSeed Challenge Completion",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    }
  };

  return (
    <div className="bg-[#1a3a2a] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {item.user_avatar ? (
          <img
            src={item.user_avatar}
            alt={item.user_name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-[#2d5a3d] flex items-center justify-center text-[#6DD4A8] font-bold text-sm">
            {getInitials(item.user_name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{item.user_name}</p>
          <p className="text-[#6DD4A8] text-xs">{formatRelativeTime(item.created_at)}</p>
        </div>
      </div>

      {/* Completion badge row */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        <span className="text-[#A8D5BF] text-xs">Completed</span>
        <button
          type="button"
          onClick={() => onOpenChallenge?.(item.challenge_id)}
          className="bg-[#2d5a3d] text-white text-xs px-2 py-0.5 rounded-full hover:bg-[#356b49] transition-colors"
          title="Open challenge details"
        >
          {item.challenge_title}
        </button>
        <span className="text-[#f5a623] text-xs font-bold">+{item.challenge_points} pts</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-[#244735] text-[#A8D5BF] px-2 py-0.5 rounded-full">
          Proof submitted
        </span>
        {item.user_location && (
          <span className="text-[10px] font-medium bg-[#22412f] text-[#CDEDDD] px-2 py-0.5 rounded-full">
            {item.user_location}
          </span>
        )}
      </div>

      {/* Photo — fixed height, not full bleed */}
      <div className="mx-4 rounded-xl overflow-hidden">
        <img
          src={item.photo_url}
          alt="Challenge completion"
          className="w-full h-56 object-cover"
          loading="lazy"
        />
      </div>

      {/* Reflection & Impact */}
      <div className="p-4">
        {item.challenge_category && (
          <p className="text-[#6DD4A8] text-xs uppercase tracking-wide mb-1">
            {item.challenge_category}
          </p>
        )}
        {item.reflection && (
          <p className="text-white text-sm leading-relaxed">
            "{item.reflection}"
          </p>
        )}
        {item.impact_summary && (
          <p className="text-[#6DD4A8] text-xs mt-2">🌱 {item.impact_summary}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={!userId || liking}
          className={`flex items-center gap-1 text-sm transition-colors ${
            liked ? "text-red-400" : "text-[#A8D5BF] hover:text-white"
          } ${!userId ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-sm text-[#A8D5BF] hover:text-white transition-colors"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
