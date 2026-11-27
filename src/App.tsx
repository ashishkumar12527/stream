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

const API_BASE = 'https://saavan.ashishkumar12527.online'

type AlbumItem = { id: string; title: string; artist: string; image: string; year: string }

function JioStream() {
  const [songs, setSongs] = useState<Song[]>(seedSongs)
  const [albums, setAlbums] = useState<AlbumItem[]>([])
  const [current, setCurrent] = useState<Song>(seedSongs[0])
  const [query, setQuery] = useState('')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(75)
  const [searching, setSearching] = useState(false)
  const [activeNav, setActiveNav] = useState('Home')
  const audioRef = useRef<HTMLAudioElement>(null)

  const cleanSong = (item: any): Song => {
    const images = item.image || []
    const downloads = item.downloadUrl || []
    return {
      id: item.id,
      name: item.name?.replace(/&amp;/g, '&') || item.title || 'Unknown song',
      artist: item.primaryArtists || item.artists?.primary?.map((artist: any) => artist.name).join(', ') || 'Various Artists',
      album: item.album?.name || item.album || 'Unknown Album',
      image: images.find((image: any) => image.quality === '500x500')?.url || images.at(-1)?.url || '',
      url: downloads.find((audio: any) => audio.quality === '320kbps')?.url || downloads.at(-1)?.url || '',
      duration: Number(item.duration) || 180,
    }
  }

  const loadHome = async () => {
    setSearching(true)
    try {
      const [songResponse, albumResponse] = await Promise.all([
        fetch(`${API_BASE}/api/search/songs?query=bollywood&limit=16`),
        fetch(`${API_BASE}/api/search/albums?query=hindi&limit=12`),
      ])
      const songData = await songResponse.json()
      const albumData = await albumResponse.json()
      const songResults = (songData?.data?.results || []).map(cleanSong)
      const albumResults = (albumData?.data?.results || []).map((item: any) => ({
        id: item.id,
        title: item.name || item.title,
        artist: item.artists?.primary?.map((artist: any) => artist.name).join(', ') || item.language || 'Various Artists',
        image: item.image?.find((image: any) => image.quality === '500x500')?.url || item.image?.at(-1)?.url || '',
        year: String(item.year || ''),
      }))
      if (songResults.length) setSongs(songResults)
      setAlbums(albumResults)
    } catch {
      setAlbums([])
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    void loadHome()
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.name,
      artist: current.artist,
      album: current.album,
      artwork: current.image ? [{ src: current.image, sizes: '500x500', type: 'image/jpeg' }] : [],
    })
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, [current, playing])

  const search = async (value: string) => {
    if (!value.trim()) return
    setSearching(true)
    setActiveNav('Search')
    try {
      const [songResponse, albumResponse] = await Promise.all([
        fetch(`${API_BASE}/api/search/songs?query=${encodeURIComponent(value)}&limit=24`),
        fetch(`${API_BASE}/api/search/albums?query=${encodeURIComponent(value)}&limit=12`),
      ])
      const songData = await songResponse.json()
      const albumData = await albumResponse.json()
      const songResults = (songData?.data?.results || []).map(cleanSong)
      const albumResults = (albumData?.data?.results || []).map((item: any) => ({
        id: item.id,
        title: item.name || item.title,
        artist: item.artists?.primary?.map((artist: any) => artist.name).join(', ') || item.language || 'Various Artists',
        image: item.image?.find((image: any) => image.quality === '500x500')?.url || item.image?.at(-1)?.url || '',
        year: String(item.year || ''),
      }))
      if (songResults.length) setSongs(songResults)
      setAlbums(albumResults)
    } catch {
      setSongs([])
    } finally {
      setSearching(false)
    }
  }

  const playSong = (song: Song) => {
    setCurrent(song)
    setProgress(0)
    const audio = audioRef.current
    if (!audio || !song.url) return
    if (audio.src !== song.url) {
      audio.src = song.url
      audio.load()
    }
    void audio.play().catch(() => setPlaying(false))
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.src) {
      playSong(current)
      return
    }
    if (audio.paused) {
      await audio.play().catch(() => undefined)
    } else {
      audio.pause()
    }
  }

  const openAlbum = async (album: AlbumItem) => {
    setQuery(album.title)
    await search(album.title)
  }

  const next = () => {
    const index = songs.findIndex((song) => song.id === current.id)
    if (songs.length) playSong(songs[(index + 1 + songs.length) % songs.length])
  }

  const previous = () => {
    const index = songs.findIndex((song) => song.id === current.id)
    if (songs.length) playSong(songs[(index - 1 + songs.length) % songs.length])
  }

  const seek = (value: number) => {
    setProgress(value)
    if (audioRef.current?.duration) audioRef.current.currentTime = (value / 100) * audioRef.current.duration
  }

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainder = Math.floor(seconds % 60)
    return `${minutes}:${remainder.toString().padStart(2, '0')}`
  }

  const fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect width="500" height="500" fill="%232d2d36"/%3E%3Ccircle cx="250" cy="250" r="120" fill="none" stroke="%23ec3b6a" stroke-width="18"/%3E%3Ccircle cx="250" cy="250" r="32" fill="%23ec3b6a"/%3E%3C/svg%3E'

  return (
    <div className="js-app">
      <aside className="js-sidebar">
        <div className="js-logo"><span>J</span><b>Stream</b></div>
        <nav>
          {[
            ['Home', '⌂'], ['Browse', '⊞'], ['Radio', '◉'], ['Podcasts', '◌'], ['Search', '⌕'], ['Library', '▰']
          ].map(([label, icon]) => (
            <button
              key={label}
              className={activeNav === label ? 'active' : ''}
              onClick={() => {
                setActiveNav(label)
                if (label === 'Search') setQuery(query || '')
                if (label === 'Browse') void search(query || 'hindi')
                if (label === 'Radio') void search(query || 'radio hits')
                if (label === 'Library' || label === 'Podcasts') window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            ><span>{icon}</span>{label}</button>
          ))}
        </nav>
        <div className="js-user"><div>AK</div><span><b>Ashish Kumar</b><small>Free account</small></span></div>
      </aside>

      <main className="js-main">
        <header className="js-header">
          <label className="js-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && search(query)} placeholder="Search" /></label>
          <button className="js-language">English</button>
          <button className="js-user-avatar">AK</button>
        </header>

        {activeNav === 'Home' ? (
          <>
            <section className="js-hero">
              <div className="js-hero-copy">
                <span>YOUR DAILY MIX</span>
                <h1>Music that feels<br />like you</h1>
                <p>Discover songs, albums and artists handpicked for you.</p>
                <button onClick={() => songs[0] && playSong(songs[0])}>▶ &nbsp; Play</button>
              </div>
              <div className="js-hero-art">
                {current.image ? <img src={current.image} onError={(event) => { event.currentTarget.src = fallback }} alt="" /> : <img src={fallback} alt="" />}
              </div>
            </section>

            <section className="js-section">
              <div className="js-section-title"><div><span>Charts</span><h2>Trending Now</h2></div><button onClick={() => search(query || 'bollywood')}>See all</button></div>
              {searching && <div className="js-loading">Loading from JioSaavn…</div>}
              <div className="js-songs">
                {songs.slice(0, 12).map((song, index) => (
                  <article className="js-song" key={`${song.id}-${index}`}>
                    <div className="js-cover"><img src={song.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt={song.name} /><button onClick={() => current.id === song.id ? togglePlay() : playSong(song)}>{current.id === song.id && playing ? 'Ⅱ' : '▶'}</button></div>
                    <h3>{song.name}</h3><p>{song.artist}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="js-section js-albums-section">
              <div className="js-section-title"><div><span>Collections</span><h2>Popular Albums</h2></div></div>
              <div className="js-albums">
                {albums.slice(0, 8).map((album) => (
                  <article className="js-album" key={album.id} onClick={() => openAlbum(album)}>
                    <div><img src={album.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt={album.title} /><button>▶</button></div>
                    <h3>{album.title}</h3><p>{album.artist}{album.year ? ` • ${album.year}` : ''}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="js-page-view">
            <div className="js-page-heading">
              <span>{activeNav === 'Library' ? 'YOUR COLLECTION' : activeNav === 'Podcasts' ? 'SHOWS & EPISODES' : 'DISCOVER'}</span>
              <h1>{activeNav}</h1>
              <p>{activeNav === 'Radio' ? 'Live-style stations from your favourite moods and artists.' : activeNav === 'Podcasts' ? 'Browse podcasts and spoken-word shows.' : activeNav === 'Library' ? 'Quick access to your liked songs and albums.' : 'Explore music, albums, artists and playlists.'}</p>
            </div>

            {activeNav === 'Radio' && (
              <div className="js-radio-grid">
                {['Hindi Hits', 'Romance', 'Party', 'Arijit Singh', 'Bollywood 90s', 'Chill'].map((station, index) => (
                  <button key={station} onClick={() => search(station)}><span>◉</span><b>{station}</b><small>Radio • {index + 1} stations</small></button>
                ))}
              </div>
            )}

            {activeNav === 'Browse' && (
              <div className="js-category-grid">
                {['Hindi', 'English', 'Punjabi', 'Romance', 'Party', 'Devotional', 'Indie', 'Retro'].map((category) => (
                  <button key={category} onClick={() => search(category)}><span>{category.slice(0, 2).toUpperCase()}</span><b>{category}</b></button>
                ))}
              </div>
            )}

            {activeNav === 'Library' && (
              <div className="js-library-grid">
                <button onClick={() => search('bollywood')}><span>♥</span><b>Liked Songs</b><small>{songs.length} songs</small></button>
                <button onClick={() => search('hindi albums')}><span>▰</span><b>Recently Played</b><small>Continue listening</small></button>
                <button onClick={() => search('hindi')}><span>＋</span><b>My Albums</b><small>{albums.length} saved</small></button>
              </div>
            )}

            {activeNav === 'Podcasts' && (
              <div className="js-category-grid podcast-grid">
                {['True Crime', 'Comedy', 'Technology', 'Business', 'Bollywood', 'Meditation'].map((category, index) => (
                  <button key={category} onClick={() => search(category)}><span>{String(index + 1).padStart(2, '0')}</span><b>{category}</b></button>
                ))}
              </div>
            )}

            {searching && <div className="js-loading">Loading from JioSaavn…</div>}
            {(activeNav === 'Search' || activeNav === 'Browse' || activeNav === 'Radio') && (
              <><div className="js-section-title"><div><span>Results</span><h2>{query ? `Search: ${query}` : 'Explore Music'}</h2></div></div><div className="js-songs">{songs.slice(0, 12).map((song, index) => (<article className="js-song" key={`${song.id}-${index}`}><div className="js-cover"><img src={song.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt={song.name} /><button onClick={() => current.id === song.id ? togglePlay() : playSong(song)}>{current.id === song.id && playing ? 'Ⅱ' : '▶'}</button></div><h3>{song.name}</h3><p>{song.artist}</p></article>))}</div></>
            )}
          </section>
        )}
      </main>

      <footer className="js-player">
        <div className="js-now"><img src={current.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt="" /><div><h3>{current.name}</h3><p>{current.artist}</p></div><button>♥</button></div>
        <div className="js-player-center">
          <div className="js-controls"><button onClick={previous}>‹</button><button className="main" onClick={togglePlay}>{playing ? 'Ⅱ' : '▶'}</button><button onClick={next}>›</button></div>
          <div className="js-timeline"><span>{formatTime(progress / 100 * current.duration)}</span><input type="range" min="0" max="100" value={progress} onChange={(event) => seek(Number(event.target.value))} /><span>{formatTime(current.duration)}</span></div>
        </div>
        <div className="js-tools"><button title="Cast">▣</button><span>♪</span><input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></div>
      </footer>

      <audio ref={audioRef} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(event) => setProgress((event.currentTarget.currentTime / (event.currentTarget.duration || current.duration)) * 100)} onEnded={next} />
    </div>
  )
}

export default JioStream
