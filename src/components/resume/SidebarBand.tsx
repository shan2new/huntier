type SidebarBandProps = {
  photoUrl?: string | null
  nameInitial?: string | null
}

export function SidebarBand({ photoUrl, nameInitial }: SidebarBandProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-24 h-24 rounded-full overflow-hidden ring-1 ring-border bg-muted">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-[22px] font-medium text-muted-foreground">
            {nameInitial ? nameInitial : 'A'}
          </div>
        )}
      </div>
      <div className="w-full h-px bg-border" />
    </div>
  )
}

export default SidebarBand


