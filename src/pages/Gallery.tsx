import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Sparkles,
  Play,
  FileText,
  Clapperboard,
  Lightbulb,
  Film,
  ImageIcon,
  Trash2,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Share2,
  ImageOff,
} from 'lucide-react'
import { useContentItems } from '@/hooks/useSupabase'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { ContentItem } from '@/lib/supabase'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const typeConfig: Record<
  string,
  { label: string; color: string; border: string; icon: React.ReactNode }
> = {
  caption: {
    label: 'Caption',
    color: '#ff0099',
    border: 'rgba(255,0,153,0.3)',
    icon: <FileText className="size-3" />,
  },
  script: {
    label: 'Script',
    color: '#00ccff',
    border: 'rgba(0,204,255,0.3)',
    icon: <Clapperboard className="size-3" />,
  },
  video: {
    label: 'Video',
    color: '#aa66ff',
    border: 'rgba(170,102,255,0.3)',
    icon: <Film className="size-3" />,
  },
  idea: {
    label: 'Idea',
    color: '#00ff88',
    border: 'rgba(0,255,136,0.3)',
    icon: <Lightbulb className="size-3" />,
  },
}

const statusColors: Record<string, string> = {
  completed: '#00ff88',
  processing: '#ffaa00',
  failed: '#ff3366',
}

/* ------------------------------------------------------------------ */
/*  Filter pills                                                       */
/* ------------------------------------------------------------------ */

const typeFilters = ['All', 'Videos', 'Images', 'Captions', 'Scripts', 'Ideas']
const sortOptions = ['Newest', 'Oldest', 'Name']

/* ------------------------------------------------------------------ */
/*  Skeleton Card                                                      */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0a0a0a] overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none bg-[#111]" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4 bg-[#1a1a1a]" />
        <Skeleton className="h-3 w-1/2 bg-[#1a1a1a]" />
        <Skeleton className="h-3 w-full bg-[#1a1a1a]" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Content Card                                                       */
/* ------------------------------------------------------------------ */

function ContentCard({
  item,
  onClick,
}: {
  item: ContentItem
  onClick: () => void
}) {
  const tConfig = typeConfig[item.content_type] || typeConfig.idea
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: easeOutExpo }}
      className="group cursor-pointer rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(255,0,153,0.15)] hover:shadow-[0_0_20px_rgba(255,0,153,0.08)]"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview area */}
      <div className="relative aspect-video bg-[#111] overflow-hidden">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : item.video_url ? (
          <video
            src={item.video_url}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03)]"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {item.content_type === 'video' ? (
              <Film className="size-10 text-[#333]" />
            ) : item.content_type === 'script' ? (
              <Clapperboard className="size-10 text-[#333]" />
            ) : item.content_type === 'idea' ? (
              <Lightbulb className="size-10 text-[#333]" />
            ) : (
              <ImageIcon className="size-10 text-[#333]" />
            )}
          </div>
        )}

        {/* Hover overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="size-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
              >
                {item.content_type === 'video' ? (
                  <Play className="size-5 text-white fill-white" />
                ) : (
                  <FileText className="size-5 text-white" />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `${statusColors[item.status] || '#888'}15`,
              color: statusColors[item.status] || '#888',
              border: `1px solid ${statusColors[item.status] || '#888'}30`,
            }}
          >
            {item.status}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-[15px] truncate leading-tight">
          {item.title}
        </h3>
        <div className="flex items-center justify-between mt-1.5">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `${tConfig.color}15`,
              color: tConfig.color,
              border: `1px solid ${tConfig.border}`,
            }}
          >
            {tConfig.icon}
            {tConfig.label}
          </span>
          <span className="text-[11px] text-[#555] font-mono">
            {formatRelativeDate(item.created_at)}
          </span>
        </div>
        <p className="text-[13px] text-[#888] mt-2 line-clamp-2 leading-relaxed">
          {item.content}
        </p>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Detail Drawer                                                      */
/* ------------------------------------------------------------------ */

function DetailDrawer({
  item,
  open,
  onClose,
  onDelete,
}: {
  item: ContentItem | null
  open: boolean
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (!item) return null

  const tConfig = typeConfig[item.content_type] || typeConfig.idea

  const handleCopy = () => {
    navigator.clipboard.writeText(item.content || "")
    toast.success('Content copied to clipboard')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/gallery?item=${item.id}`
    )
    toast.success('Link copied to clipboard')
  }

  const handleDelete = () => {
    onDelete(item.id)
    setDeleteDialogOpen(false)
    onClose()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[480px] bg-[#0a0a0a] border-l border-[rgba(255,255,255,0.08)] p-0 flex flex-col"
        >
          <SheetHeader className="p-5 border-b border-[rgba(255,255,255,0.06)]">
            <SheetTitle className="font-['Bangers'] text-2xl tracking-wide uppercase bg-gradient-to-r from-[#ff0099] to-[#00ccff] bg-clip-text text-transparent pr-8">
              {item.title}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Content details for {item.title}
            </SheetDescription>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: `${tConfig.color}15`,
                  color: tConfig.color,
                  border: `1px solid ${tConfig.border}`,
                }}
              >
                {tConfig.icon}
                {tConfig.label}
              </span>
              <span className="text-[12px] text-[#555]">
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Full preview */}
            {item.video_url ? (
              <video
                src={item.video_url}
                controls
                className="w-full aspect-video rounded-xl bg-black"
                poster={item.thumbnail_url || undefined}
              />
            ) : item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full rounded-xl"
              />
            ) : null}

            {/* Platform */}
            <p className="text-[13px] text-[#cccccc]">
              Created for{' '}
              <span className="capitalize font-medium text-white">
                {item.platform}
              </span>
            </p>

            {/* Content */}
            <div>
              <h4 className="text-[12px] font-medium text-[#888] uppercase tracking-wider mb-2">
                Content
              </h4>
              <div className="bg-[#111] rounded-lg p-4 text-[14px] text-[#cccccc] leading-relaxed whitespace-pre-wrap">
                {item.content}
              </div>
            </div>

            {/* Prompt used */}
            <div>
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="flex items-center gap-2 text-[12px] font-medium text-[#888] uppercase tracking-wider mb-2 hover:text-white transition-colors"
              >
                AI Prompt
                {showPrompt ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
              </button>
              <AnimatePresence>
                {showPrompt && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#111] rounded-lg p-4 font-mono text-[13px] text-[#888] leading-relaxed">
                      {item.prompt_used}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-5 border-t border-[rgba(255,255,255,0.06)] flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="border-[rgba(255,255,255,0.15)] bg-transparent text-white hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
            >
              <Copy className="size-3.5 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="border-[rgba(255,255,255,0.15)] bg-transparent text-white hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
            >
              <Share2 className="size-3.5 mr-1" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const blob = new Blob([item.content || ""], { type: "text/plain" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${item.title}.txt`
                a.click()
                URL.revokeObjectURL(url)
                toast.success('Downloaded')
              }}
              className="border-[rgba(255,255,255,0.15)] bg-transparent text-white hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
            >
              <Download className="size-3.5 mr-1" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="ml-auto text-[#555] hover:text-[#ff3366] hover:bg-[rgba(255,51,102,0.1)]"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] text-white">
          <DialogHeader>
            <DialogTitle className="font-['Bangers'] text-xl tracking-wide uppercase">
              Delete Content
            </DialogTitle>
            <DialogDescription className="text-[#888]">
              This will permanently delete &quot;{item.title}&quot;. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-[#cccccc] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-[#ff3366] hover:bg-[#ff3366]/80 text-white"
            >
              <Trash2 className="size-3.5 mr-1" />
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
      className="col-span-full flex flex-col items-center justify-center py-24"
    >
      <ImageOff className="size-12 text-[#333] mb-4" />
      <h3 className="text-[#888] text-lg font-medium">No content yet</h3>
      <p className="text-[#555] text-sm mt-1 mb-6">
        Start creating in the studio to see your content here.
      </p>
      <Button
        onClick={() => navigate('/studio')}
        className="bg-gradient-to-r from-[#ff0099] to-[#00ccff] text-black font-['Bangers'] uppercase tracking-wider hover:scale-105 transition-transform"
      >
        <Sparkles className="size-4 mr-2" />
        Go to Studio
      </Button>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Gallery Page                                                  */
/* ------------------------------------------------------------------ */

export default function Gallery() {
  const { items, loading } = useContentItems()
  const { deleteItem } = useContentItems()
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

  const filteredItems = useMemo(() => {
    let result = [...items]

    // Type filter
    if (activeFilter === 'Videos') {
      result = result.filter((i) => i.content_type === 'video')
    } else if (activeFilter === 'Images') {
      result = result.filter(
        (i) => i.thumbnail_url && i.content_type !== 'video'
      )
    } else if (activeFilter !== 'All') {
      result = result.filter(
        (i) => i.content_type === activeFilter.toLowerCase()
      )
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.content || "").toLowerCase().includes(q) ||
          (i.prompt_used || "").toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortBy === 'Newest') {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } else if (sortBy === 'Oldest') {
      result.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    } else if (sortBy === 'Name') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  }, [items, activeFilter, searchQuery, sortBy])

  const handleCardClick = useCallback((item: ContentItem) => {
    setSelectedItem(item)
    setDrawerOpen(true)
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      const success = await deleteItem(id)
      if (success) {
        toast.success('Content deleted')
      } else {
        toast.error('Failed to delete content')
      }
    },
    [deleteItem]
  )

  return (
    <div className="min-h-[100dvh] bg-black">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-[1280px] mx-auto px-6 md:px-10 lg:px-16 pt-8 pb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
              className="font-['Bangers'] text-[28px] md:text-[36px] tracking-wider uppercase bg-gradient-to-r from-[#ff0099] to-[#00ccff] bg-clip-text text-transparent leading-tight"
            >
              YOUR CONTENT GALLERY
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-[#888] text-[15px] mt-1"
            >
              {items.length} creation{items.length !== 1 ? 's' : ''}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-3"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#555]" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[220px] md:w-[280px] bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg pl-10 pr-4 py-2.5 text-[14px] text-white placeholder:text-[#555] focus:border-[#ff0099] focus:shadow-[0_0_0_3px_rgba(255,0,153,0.15)] outline-none transition-all"
              />
            </div>

            {/* New Creation button */}
            <Button
              onClick={() => navigate('/studio')}
              className="bg-gradient-to-r from-[#ff0099] to-[#00ccff] text-black font-['Bangers'] uppercase tracking-wider text-[13px] px-5 py-2.5 rounded-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,0,153,0.3)]"
            >
              <Sparkles className="size-3.5 mr-1.5" />
              New Creation
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOutExpo }}
        className="sticky top-0 z-30 bg-[rgba(0,0,0,0.95)] backdrop-blur-md border-b border-[rgba(255,255,255,0.06)]"
      >
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 lg:px-16 py-3 flex flex-wrap items-center gap-3">
          {/* Type pills */}
          <div className="flex items-center gap-1 bg-[#111] rounded-lg p-1">
            {typeFilters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  'px-3 py-1.5 text-[12px] font-medium rounded-md transition-all',
                  activeFilter === f
                    ? 'bg-[#0a0a0a] text-[#ff0099] shadow-sm'
                    : 'text-[#888] hover:text-white'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="ml-auto flex items-center gap-1 bg-[#111] rounded-lg p-1">
            {sortOptions.map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn(
                  'px-3 py-1.5 text-[12px] font-medium rounded-md transition-all',
                  sortBy === s
                    ? 'bg-[#0a0a0a] text-[#00ccff] shadow-sm'
                    : 'text-[#888] hover:text-white'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 lg:px-16 py-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  onClick={() => handleCardClick(item)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        item={selectedItem}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setTimeout(() => setSelectedItem(null), 300)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}
