'use client'

import { ExternalLink } from 'lucide-react'

export type Platform = 'base' | 'twitter'

interface PostPreviewCardProps {
  postUrl: string
  authorHandle: string
  postText: string
  postedAt?: string // Optional: e.g. "2h ago"
  platform?: Platform // 'base' or 'twitter'
  compact?: boolean // For in-card usage (smaller sizing)
}

export function PostPreviewCard({
  postUrl,
  authorHandle,
  postText,
  postedAt,
  platform = 'base',
  compact = false,
}: PostPreviewCardProps) {
  const handleViewPost = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(postUrl, '_blank', 'noopener,noreferrer')
  }

  const platformIcon = platform === 'twitter' ? '𝕏' : '🔵'
  const platformLabel = platform === 'twitter' ? 'Twitter' : 'Base'
  const actionLabel = platform === 'twitter' ? 'View tweet' : 'View post'

  return (
    <div className={`post-preview ${compact ? 'post-preview--compact' : ''}`}>
      {/* Content Section */}
      <div className="post-preview__content">
        {/* Platform Badge + Meta Row */}
        <div className="post-preview__meta">
          <span className="post-preview__platform" title={platformLabel}>
            {platformIcon}
          </span>
          <span className="post-preview__handle">{authorHandle}</span>
          {postedAt && (
            <>
              <span className="post-preview__dot">·</span>
              <span className="post-preview__time">{postedAt}</span>
            </>
          )}
        </div>

        {/* Post Snippet (clamped to 2-3 lines) */}
        <p className="post-preview__text">{postText}</p>

        {/* Action: View Post */}
        <button
          className="post-preview__action btn-press"
          onClick={handleViewPost}
          type="button"
        >
          <ExternalLink size={14} />
          <span>{actionLabel}</span>
        </button>
      </div>
    </div>
  )
}
