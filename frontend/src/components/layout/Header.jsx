import Logo from './Logo'
import { useAuth } from '../../context/AuthContext'

export default function Header({ onToggleSidebar }) {
  const { user } = useAuth()
  const name = user?.name || 'User'

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.()
  }

  return (
    <header className="sticky top-0 z-30 flex h-[57px] shrink-0 items-center gap-[22px] bg-chrome px-[22px]">
      <Logo />
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle menu"
        className="flex h-[30px] w-[32px] items-center justify-center rounded-[4px] border-[0.909px] border-chrome-line text-[13px] text-chrome-muted hover:bg-white/5"
      >
        ☰
      </button>
      <div className="ml-auto flex items-center gap-[22px]">
        <button type="button" onClick={toggleFullscreen} aria-label="Toggle full screen" className="text-[12px] text-chrome-text">
          ⛶
        </button>
        <div className="flex items-center gap-[5px]">
          <span className="flex size-[26px] items-center justify-center rounded-full bg-[#d8e8f5] text-[12px] font-bold text-[#445566]">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="text-[12px] text-chrome-text">{name}</span>
        </div>
      </div>
    </header>
  )
}
