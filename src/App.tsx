import { useEffect, useRef, useState } from 'react'
import './App.css'

type Song = {
  id: string
  name: string
  artist: string
  album: string
  image: string
  url: string
  duration: number
}

const seedSongs: Song[] = [
  { id: '1', name: 'Kesariya', artist: 'Arijit Singh', album: 'Brahmāstra', image: 'https://c.saavncdn.com/242/Brahmastra-Pt-1-Shiva-Hindi-2022-20220823141012-500x500.jpg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 268 },
  { id: '2', name: 'Apna Bana Le', artist: 'Arijit Singh, Sachin-Jigar', album: 'Bhediya', image: 'https://c.saavncdn.com/815/Bhediya-Hindi-2022-20221122192706-500x500.jpg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 261 },
  { id: '3', name: 'Chaleya', artist: 'Anirudh, Arijit Singh', album: 'Jawan', image: 'https://c.saavncdn.com/026/Jawan-Hindi-2023-20230818093102-500x500.jpg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 200 },
  { id: '4', name: 'Heeriye', artist: 'Jasleen Royal, Arijit Singh', album: 'Heeriye', image: 'https://c.saavncdn.com/440/Heeriye-feat-Arijit-Singh-Hindi-2023-20230825115911-500x500.jpg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 194 },
  { id: '5', name: 'Tere Vaaste', artist: 'Varun Jain, Sachin-Jigar', album: 'Zara Hatke Zara Bachke', image: 'https://c.saavncdn.com/460/Zara-Hatke-Zara-Bachke-Hindi-2023-20230519135215-500x500.jpg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: 226 },
]

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
}

function App() {
  const [theme, setTheme] = useState<'midnight' | 'sunset' | 'ocean'>('midnight')
  const [songs, setSongs] = useState<Song[]>(seedSongs)
  const [current, setCurrent] = useState<Song>(seedSongs[0])
  const [query, setQuery] = useState('')
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(70)
  const [progress, setProgress] = useState(0)
  const [mode, setMode] = useState<'Music' | 'Video'>('Music')
  const [loading, setLoading] = useState(false)
  const [liked, setLiked] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const bars = Array.from({ length: 42 }, (_, i) => i)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.name,
        artist: current.artist,
        album: current.album,
        artwork: [{ src: current.image, sizes: '500x500', type: 'image/jpeg' }],
      })
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
      navigator.mediaSession.setActionHandler('play', () => void togglePlay(true))
      navigator.mediaSession.setActionHandler('pause', () => void togglePlay(false))
      navigator.mediaSession.setActionHandler('previoustrack', previous)
      navigator.mediaSession.setActionHandler('nexttrack', next)
    }
  }, [current, playing])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  const search = async (value = query) => {
    if (!value.trim()) return
    setLoading(true)
    try {
      const response = await fetch(`https://saavan.ashishkumar12527.online/api/search/songs?query=${encodeURIComponent(value)}&limit=12`)
      if (!response.ok) throw new Error('Search unavailable')
      const data = await response.json()
      const results: Song[] = (data?.data?.results || []).map((item: any) => ({
        id: item.id,
        name: item.name?.replace(/&amp;/g, '&') || 'Unknown song',
        artist: item.primaryArtists || item.artists?.primary?.map((a: any) => a.name).join(', ') || item.artists?.all?.map((a: any) => a.name).join(', ') || 'Unknown artist',
        album: item.album?.name || 'Single',
        image: item.image?.find((image: any) => image.quality === '500x500')?.url || item.image?.[item.image.length - 1]?.url || '',
        url: item.downloadUrl?.find((audio: any) => audio.quality === '320kbps')?.url || item.downloadUrl?.[item.downloadUrl.length - 1]?.url || '',
        duration: Number(item.duration) || 180,
      }))
      if (results.length) setSongs(results)
    } catch {
      setSongs(seedSongs.filter((song) => `${song.name} ${song.artist}`.toLowerCase().includes(value.toLowerCase())))
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = async (nextState = !playing) => {
    const audio = audioRef.current
    if (!audio) return
    if (nextState) {
      if (!audio.src && current.url) audio.src = current.url
      try {
        await audio.play()
        setPlaying(true)
      } catch {
        setPlaying(false)
      }
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  const playSong = (song: Song) => {
    setCurrent(song)
    setProgress(0)
    const audio = audioRef.current
    if (song.url && audio) {
      if (audio.src !== song.url) {
        audio.pause()
        audio.src = song.url
        audio.load()
      }
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      setPlaying(false)
    }
  }

  const next = () => {
    const index = songs.findIndex((song) => song.id === current.id)
    playSong(songs[(index + 1) % songs.length])
  }

  const previous = () => {
    const index = songs.findIndex((song) => song.id === current.id)
    playSong(songs[(index - 1 + songs.length) % songs.length])
  }

  const cast = () => {
    if (!(window as any).chrome?.cast) {
      alert('Chrome Cast is available in supported Chrome browsers. Open this page in Chrome and try again.')
      return
    }
  }

  const seek = (value: number) => {
    setProgress(value)
    const audio = audioRef.current
    if (audio?.duration) audio.currentTime = (value / 100) * audio.duration
  }

  const duration = current.duration

  const artworkFallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"%3E%3Cdefs%3E%3ClinearGradient id="g" x2="1" y2="1"%3E%3Cstop stop-color="%236757d9"/%3E%3Cstop offset="1" stop-color="%23e66c63"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="500" height="500" fill="url(%23g)"/%3E%3Ccircle cx="250" cy="250" r="105" fill="none" stroke="white" stroke-width="18" opacity=".9"/%3E%3Ccircle cx="250" cy="250" r="25" fill="white"/%3E%3C/svg%3E'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>Stream</span></div>
        <nav>
          <button className="nav-item active"><span>⌂</span> Home</button>
          <button className="nav-item"><span>⌕</span> Search</button>
          <button className="nav-item"><span>♬</span> Library</button>
        </nav>
        <div className="side-section">
          <p>Playlists</p>
          <button>♥ &nbsp; Liked Songs</button>
          <button>♪ &nbsp; My Playlist</button>
          <button>☁ &nbsp; Downloaded</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="search-box">
            <span>⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Search songs, albums, artists" />
          </div>
          <div className="mode-switch">
            {(['Music', 'Video'] as const).map((item) => <button key={item} className={mode === item ? 'selected' : ''} onClick={() => setMode(item)}>{item}</button>)}
          </div>
          <button className="avatar" onClick={() => setMenuOpen(!menuOpen)}>AK</button>
          {menuOpen && <div className="profile-menu"><button>Profile</button><button>Settings</button></div>}
        </header>

        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">Recommended for you</span>
            <h1>Feel the sound.<br />Live the moment.</h1>
            <p>Discover trending music and hand-picked favourites.</p>
            <button className="play-hero" onClick={() => current.id === songs[0]?.id && current.url ? togglePlay(!playing) : playSong(songs[0])}>{playing ? '▮▮' : '▶'} &nbsp; {playing ? 'Pause' : 'Play Now'}</button>
          </div>
          <div className="hero-art">
            <div className="visualizer hero-bars">
              {bars.map((bar) => <i key={bar} style={{ height: `${22 + ((bar * 13) % 78)}%`, animationDelay: `${(bar % 8) * -0.11}s` }} />)}
            </div>
            {current.image ? <img src={current.image} alt="Now playing artwork" /> : <div className="art-fallback" style={{ backgroundImage: `url(${artworkFallback})` }}>S</div>}
          </div>
        </section>

        <section className="section-head">
          <div><span>Made for you</span><h2>{query ? `Results for “${query}”` : 'Trending now'}</h2></div>
          <button onClick={() => search(query || 'Bollywood')}>View all</button>
        </section>

        {loading && <div className="loading">Searching JioSaavn…</div>}
        <div className="song-grid">
          {songs.slice(0, 8).map((song, index) => (
            <article className={`song-card ${current.id === song.id ? 'is-current' : ''}`} key={song.id} onDoubleClick={() => playSong(song)}>
              <div className="cover">
                {song.image ? <img src={song.image} alt={song.name} /> : <div className="art-fallback" style={{ backgroundImage: `url(${artworkFallback})` }}>♪</div>}
                <button className="card-play" onClick={() => current.id === song.id ? togglePlay(!playing) : playSong(song)}>{current.id === song.id && playing ? '▮▮' : '▶'}</button>
                <span className="rank">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3>{song.name}</h3>
              <p>{song.artist}</p>
            </article>
          ))}
        </div>

        <section className="theme-panel">
          <div><span>Appearance</span><h2>Choose your mood</h2></div>
          <div className="theme-options">
            {(['midnight', 'sunset', 'ocean'] as const).map((item) => <button key={item} className={theme === item ? 'active' : ''} onClick={() => setTheme(item)}><i className={item} />{item}</button>)}
          </div>
        </section>
      </main>

      <footer className="player">
        <div className="now-playing">
          {current.image ? <img src={current.image} alt="" /> : <div className="mini-art" style={{ backgroundImage: `url(${artworkFallback})` }}>S</div>}
          <div><h3>{current.name}</h3><p>{current.artist}</p></div>
          <button className={liked.includes(current.id) ? 'liked' : ''} onClick={() => setLiked((items) => items.includes(current.id) ? items.filter((id) => id !== current.id) : [...items, current.id])}>♥</button>
        </div>
        <div className="player-center">
          <div className="controls">
            <button onClick={previous}>‹</button>
            <button className="main-control" onClick={() => togglePlay()}>{playing ? '▮▮' : '▶'}</button>
            <button onClick={next}>›</button>
          </div>
          <div className="timeline"><span>{formatTime(progress / 100 * duration)}</span><input aria-label="Track progress" type="range" min="0" max="100" value={progress} onChange={(e) => seek(Number(e.target.value))} /><span>{formatTime(duration)}</span></div>
        </div>
        <div className="player-tools">
          <button onClick={cast} title="Cast">▣</button>
          <button title="Queue">≡</button>
          <span>♬</span><input aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        </div>
      </footer>

      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setProgress((event.currentTarget.currentTime / (event.currentTarget.duration || duration)) * 100)}
        onError={() => setPlaying(false)}
        onEnded={next}
      />
    </div>
  )
}

export default App
