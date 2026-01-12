/**
 * Helper function to render attachment thumbnails in templates
 */

export function renderAttachmentThumbnail(
  attachment: any,
  attachmentUrl: string | undefined,
  tbItemCache: Record<number, any>,
  index: number,
  onOpen?: (url: string, title: string) => void
) {
  const item = attachment?.id ? tbItemCache[attachment.id] : attachment
  const fileType = item?.file_type || attachment?.file_type || ''
  const title = item?.title || attachment?.title || 'Attachment'
  const isImg = fileType.startsWith('image/')
  const isVid = fileType.startsWith('video/')
  const isPdf = fileType.includes('pdf') || title.toLowerCase().endsWith('.pdf')
  const label = isImg ? 'IMG' : isVid ? 'VID' : isPdf ? 'PDF' : 'FILE'

  const url = attachmentUrl || (item?.file_path ? undefined : null)

  if (url && isImg) {
    return (
      <div className="w-full h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  if (url && isVid) {
    return (
      <div className="w-full h-32 rounded-xl border border-slate-200 overflow-hidden bg-black relative">
        <video className="w-full h-full object-cover" src={url} muted playsInline preload="metadata" />
        <div className="absolute inset-0 flex items-center justify-center text-white text-xl">▶</div>
      </div>
    )
  }

  return (
    <div className="w-full h-32 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
      <div className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700">
        {label}
      </div>
    </div>
  )
}
