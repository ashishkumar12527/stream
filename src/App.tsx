import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import './theme.css'

type Song = {
  id: string
  name: string
  artist: string
  album: string
  image: string
  url: string
  officialUrl?: string
  duration: number
}

const seedSongs: Song[] = [
  { id: '1', name: 'Kesariya', artist: 'Arijit Singh', album: 'Brahmāstra', image: 'https://c.saavncdn.com/242/Brahmastra-Pt-1-Shiva-Hindi-2022-20220823141012-500x500.jpg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 268 },
  { id: '2', name: 'Apna Bana Le', artist: 'Arijit Singh, Sachin-Jigar', album: 'Bhediya', image: 'https://c.saavncdn.com/815/Bhediya-Hindi-2022-20221122192706-500x500.jpg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 261 },
  { id: '3', name: 'Chaleya', artist: 'Anirudh, Arijit Singh', album: 'Jawan', image: 'https://c.saavncdn.com/026/Jawan-Hindi-2023-20230818093102-500x500.jpg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 200 },
  { id: '4', name: 'Heeriye', artist: 'Jasleen Royal, Arijit Singh', album: 'Heeriye', image: 'https://c.saavncdn.com/440/Heeriye-feat-Arijit-Singh-Hindi-2023-20230825115911-500x500.jpg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 194 },
  { id: '5', name: 'Tere Vaaste', artist: 'Varun Jain, Sachin-Jigar', album: 'Zara Hatke Zara Bachke', image: 'https://c.saavncdn.com/460/Zara-Hatke-Zara-Bachke-Hindi-2023-20230519135215-500x500.jpg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: 226 },
]

const API_BASE = 'https://saavn.sumit.co'

type AlbumItem = { id: string; title: string; artist: string; image: string; year: string }
type PlaylistItem = { id: string; title: string; image: string; songCount: number; officialUrl?: string }
type WeatherDay = { date: string; code: number; low: number; high: number }
type LocalWeather = {
  location: string
  details: string
  locationNote: string
  timezone: string
  temperature: number
  feelsLike: number
  code: number
  isDay: boolean
  forecast: WeatherDay[]
}
type WeatherLocation = { location: string; details: string; note: string }

const weatherDescription = (code: number) => {
  if (code === 0) return 'Clear sky'
  if ([1, 2, 3].includes(code)) return ['Mainly clear', 'Partly cloudy', 'Overcast'][code - 1]
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Current conditions'
}

const weatherSymbol = (code: number, isDay = true) => {
  if (code === 0) return isDay ? '☀' : '☾'
  if ([1, 2, 3].includes(code)) return '☁'
  if ([45, 48].includes(code)) return '≋'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄'
  if ([95, 96, 99].includes(code)) return '⚡'
  return '☂'
}

const weatherAnimation = (code: number) => {
  if (code === 0) return 'sun'
  if ([1, 2].includes(code)) return 'partly-cloudy'
  if (code === 3) return 'cloud'
  if ([45, 48].includes(code)) return 'fog'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if ([95, 96, 99].includes(code)) return 'storm'
  return 'rain'
}

function JioStream() {
  const [songs, setSongs] = useState<Song[]>(seedSongs)
  const [homeSongs, setHomeSongs] = useState<Song[]>([])
  const [albums, setAlbums] = useState<AlbumItem[]>([])
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([])
  const [podcastPlaylists, setPodcastPlaylists] = useState<PlaylistItem[]>([])
  const [searchPlaylists, setSearchPlaylists] = useState<PlaylistItem[]>([])
  const [podcastsLoading, setPodcastsLoading] = useState(false)
  const [podcastsError, setPodcastsError] = useState('')
  const [activeAlbum, setActiveAlbum] = useState<AlbumItem | null>(null)
  const [activePlaylist, setActivePlaylist] = useState<PlaylistItem | null>(null)
  const [homePlaylistTitle, setHomePlaylistTitle] = useState('Latest Music')
  const [current, setCurrent] = useState<Song>(seedSongs[0])
  const [query, setQuery] = useState('')
  const [playing, setPlaying] = useState(false)
  const [playbackError, setPlaybackError] = useState('')
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(75)
  const [muted, setMuted] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [activeNav, setActiveNav] = useState('Home')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('stream-theme') === 'dark')
  const [clockNow, setClockNow] = useState(() => new Date())
  const [localWeather, setLocalWeather] = useState<LocalWeather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)
  const [accountName, setAccountName] = useState(() => localStorage.getItem('stream-account') || '')
  const [email, setEmail] = useState(() => localStorage.getItem('stream-email') || '')
  const [authError, setAuthError] = useState('')
  const [likedSongs, setLikedSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('stream-liked-songs')
    return saved ? JSON.parse(saved) as Song[] : []
  })
  const [showLikedSongs, setShowLikedSongs] = useState(false)
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'ring' | 'off'>('bars')
  const [visualizerReady, setVisualizerReady] = useState(false)
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false)
  const [mood, setMood] = useState('Romance')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [castSession, setCastSession] = useState<any>(null)
  const [castError, setCastError] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const visualizerRef = useRef<HTMLDivElement>(null)
  const detailRequestIdRef = useRef(0)
  const weatherRequestIdRef = useRef(0)
  const lastVolumeRef = useRef(75)

  useEffect(() => () => {
    void audioContextRef.current?.close()
  }, [])

  useEffect(() => {
    if (!fullPlayerOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullPlayerOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [fullPlayerOpen])

  useEffect(() => {
    const analyser = analyserRef.current
    const visualizer = visualizerRef.current
    if (!playing || !visualizerReady || !analyser || !visualizer) return

    const frequencies = new Uint8Array(analyser.frequencyBinCount)
    const bars = Array.from(visualizer.querySelectorAll('i'))
    let frame = 0

    const draw = () => {
      analyser.getByteFrequencyData(frequencies)
      let totalLevel = 0

      bars.forEach((bar, index) => {
        const firstBin = Math.floor(index * frequencies.length / bars.length)
        const lastBin = Math.max(firstBin + 1, Math.floor((index + 1) * frequencies.length / bars.length))
        let frequency = 0
        for (let bin = firstBin; bin < lastBin; bin += 1) {
          frequency = Math.max(frequency, frequencies[bin] / 255)
        }
        const level = Math.min(1, frequency * 2.4)
        bar.style.setProperty('--bar-level', level.toFixed(2))
        totalLevel += level
      })

      visualizer.style.setProperty('--visualizer-level', (totalLevel / bars.length).toFixed(2))
      frame = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(frame)
  }, [playing, visualizerMode, visualizerReady])

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
      officialUrl: typeof item.url === 'string' && item.url.startsWith('https://www.jiosaavn.com/') ? item.url : undefined,
      duration: Number(item.duration) || 180,
    }
  }

  const loadHome = async () => {
    setSearching(true)
    setSearchError('')
    try {
      const [playlistSearchResponse, albumResponse, playlistsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/search/playlists?query=latest%20hindi%20songs&limit=1`),
        fetch(`${API_BASE}/api/search/albums?query=hindi&limit=12`),
        fetch(`${API_BASE}/api/search/playlists?query=hindi&limit=12`),
      ])
      if (!playlistSearchResponse.ok || !albumResponse.ok || !playlistsResponse.ok) throw new Error('Home music request failed')
      const playlistSearchData = await playlistSearchResponse.json()
      const albumData = await albumResponse.json()
      const playlistsData = await playlistsResponse.json()
      const latestPlaylist = playlistSearchData?.data?.results?.[0]
      if (!latestPlaylist?.id) throw new Error('Latest music playlist not found')
      const playlistResponse = await fetch(`${API_BASE}/api/playlists?id=${encodeURIComponent(latestPlaylist.id)}`)
      if (!playlistResponse.ok) throw new Error('Latest music playlist request failed')
      const playlistData = await playlistResponse.json()
      const songResults = (playlistData?.data?.songs || []).map(cleanSong)
      if (!songResults.length) throw new Error('Latest music playlist is empty')
      const albumResults = (albumData?.data?.results || []).map((item: any) => ({
        id: item.id,
        title: item.name || item.title,
        artist: item.artists?.primary?.map((artist: any) => artist.name).join(', ') || item.language || 'Various Artists',
        image: item.image?.find((image: any) => image.quality === '500x500')?.url || item.image?.at(-1)?.url || '',
        year: String(item.year || ''),
      }))
      const playlistResults = (playlistsData?.data?.results || [])
        .filter((item: any) => item.id !== latestPlaylist.id)
        .map((item: any) => ({
          id: item.id,
          title: item.name || item.title || 'Music Playlist',
          image: item.image?.find((image: any) => image.quality === '500x500')?.url || item.image?.at(-1)?.url || '',
          songCount: Number(item.songCount || item.count || item.more_info?.song_count) || 0,
          officialUrl: typeof item.url === 'string' && item.url.startsWith('https://www.jiosaavn.com/') ? item.url : undefined,
        }))
      setHomeSongs(songResults)
      setSongs(songResults)
      setCurrent((previous) => previous.id === seedSongs[0].id ? songResults[0] : previous)
      setHomePlaylistTitle(latestPlaylist.name || latestPlaylist.title || 'Latest Music')
      setAlbums(albumResults)
      setPlaylists(playlistResults)
    } catch {
      setHomeSongs([])
      setAlbums([])
      setPlaylists([])
      setSearchError('Could not load the latest music. Please try again later.')
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    void loadHome()
  }, [])

  useEffect(() => {
    const scriptUrl = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1'
    if (document.querySelector(`script[src="${scriptUrl}"]`)) return
    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    document.head.appendChild(script)
  }, [])

  const normalizeSearch = (value: string) => {
    const corrections: Record<string, string> = {
      kesriya: 'kesariya', kesaria: 'kesariya', arjit: 'arijit singh', arjith: 'arijit singh',
      caleya: 'chaleya', heerye: 'heeriye', appna: 'apna bana le', terewaste: 'tere vaaste',
      bolywood: 'bollywood', punjabi: 'punjabi', romanoce: 'romance', romantc: 'romance',
    }
    const cleaned = value.toLowerCase().trim().replace(/[^\p{L}\p{M}\p{N} ]/gu, '').replace(/\s+/g, ' ')
    return corrections[cleaned] || cleaned
  }

  const updateSuggestions = (value: string) => {
    setQuery(value)
    const seed = ['Arijit Singh', 'Kesariya', 'Chaleya', 'Apna Bana Le', 'Heeriye', 'Tere Vaaste', 'Bollywood Hits', 'Romantic Songs']
    if (!value.trim()) setSuggestions([])
    else setSuggestions(seed.filter((item) => item.toLowerCase().includes(value.toLowerCase()) || item.toLowerCase().includes(normalizeSearch(value))))
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
      audioRef.current.muted = muted
    }
  }, [volume, muted])

  useEffect(() => {
    localStorage.setItem('stream-liked-songs', JSON.stringify(likedSongs))
  }, [likedSongs])

  useEffect(() => {
    localStorage.setItem('stream-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const loadWeather = async (
    latitude: number,
    longitude: number,
    locationHint?: WeatherLocation,
    requestId = ++weatherRequestIdRef.current,
  ) => {
    setWeatherLoading(true)
    setWeatherError('')
    const weatherParams = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,apparent_temperature,weather_code,is_day',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: '4',
    })
    try {
      const locationParams = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        localityLanguage: 'en',
      })
      const [weatherResponse, locationResponse] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`),
        locationHint
          ? Promise.resolve(null)
          : fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${locationParams}`).catch(() => null),
      ])
      if (requestId !== weatherRequestIdRef.current) return
      if (!weatherResponse.ok) throw new Error(`Weather service returned ${weatherResponse.status}.`)
      const weatherData = await weatherResponse.json()
      if (!weatherData?.current || !Array.isArray(weatherData?.daily?.time)) {
        throw new Error('Weather data was incomplete. Please try again.')
      }

      let locationData: { city?: string; locality?: string; principalSubdivision?: string; countryName?: string } | null = null
      if (locationResponse?.ok) {
        try {
          locationData = await locationResponse.json()
        } catch {
          locationData = null
        }
      }
      const city = locationData?.city || locationData?.locality || locationData?.principalSubdivision
      const details = [
        locationData?.city || locationData?.locality ? locationData?.principalSubdivision : '',
        locationData?.countryName,
      ].filter(Boolean).join(', ')
      const location = locationHint?.location || city || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`

      setLocalWeather({
        location,
        details: locationHint?.details || details || 'Current device location',
        locationNote: locationHint?.note || (city ? '' : 'City name unavailable; showing weather for your coordinates.'),
        timezone: weatherData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        temperature: Number(weatherData.current.temperature_2m),
        feelsLike: Number(weatherData.current.apparent_temperature),
        code: Number(weatherData.current.weather_code),
        isDay: Number(weatherData.current.is_day) === 1,
        forecast: weatherData.daily.time.slice(0, 4).map((date: string, index: number) => ({
          date,
          code: Number(weatherData.daily.weather_code[index]),
          low: Number(weatherData.daily.temperature_2m_min[index]),
          high: Number(weatherData.daily.temperature_2m_max[index]),
        })),
      })
    } catch (error) {
      if (requestId === weatherRequestIdRef.current) {
        setWeatherError(error instanceof Error ? error.message : 'Could not load the weather forecast.')
      }
    } finally {
      if (requestId === weatherRequestIdRef.current) setWeatherLoading(false)
    }
  }

  const loadWeatherFromIp = async () => {
    const requestId = ++weatherRequestIdRef.current
    try {
      const response = await fetch('https://ipapi.co/json/')
      if (!response.ok) throw new Error(`Location service returned ${response.status}.`)
      const locationData = await response.json()
      const latitude = Number(locationData.latitude)
      const longitude = Number(locationData.longitude)
      if (requestId !== weatherRequestIdRef.current) return
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('Could not determine an approximate location from your public IP.')
      }
      const region = locationData.region
      void loadWeather(latitude, longitude, {
        location: locationData.city || region || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
        details: [region, locationData.country_name].filter(Boolean).join(', ') || 'Approximate IP location',
        note: 'Approximate location based on your public IP; a VPN may affect the result.',
      }, requestId)
    } catch (error) {
      if (requestId === weatherRequestIdRef.current) {
        setWeatherLoading(false)
        setWeatherError(error instanceof Error ? error.message : 'Could not determine your approximate location.')
      }
    }
  }

  const requestLocalWeather = () => {
    const requestId = ++weatherRequestIdRef.current
    setWeatherError('')
    if (!navigator.geolocation) {
      setWeatherLoading(false)
      setWeatherError('This browser does not support device location.')
      return
    }
    setWeatherLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { void loadWeather(coords.latitude, coords.longitude, undefined, requestId) },
      (error) => {
        if (requestId === weatherRequestIdRef.current) {
          setWeatherLoading(false)
          setWeatherError(error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Allow it in your browser settings to see local weather.'
            : 'Could not get your location. Check your connection and try again.')
        }
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 15 * 60 * 1000 },
    )
  }

  useEffect(() => {
    const request = window.setTimeout(() => { void loadWeatherFromIp() }, 0)
    return () => {
      window.clearTimeout(request)
      weatherRequestIdRef.current += 1
    }
  }, [])

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

  const search = async (value: string, destination = 'Search') => {
    if (!value.trim()) return
    const requestId = ++detailRequestIdRef.current
    const corrected = normalizeSearch(value)
    setQuery(corrected)
    setActiveAlbum(null)
    setActivePlaylist(null)
    setSuggestions([])
    setSongs([])
    setAlbums([])
    setSearchPlaylists([])
    setSearchError('')
    setSearching(true)
    setActiveNav(destination)
    try {
      const [songResponse, albumResponse, playlistResponse] = await Promise.all([
        fetch(`${API_BASE}/api/search/songs?query=${encodeURIComponent(corrected)}&limit=24`),
        fetch(`${API_BASE}/api/search/albums?query=${encodeURIComponent(corrected)}&limit=12`),
        fetch(`${API_BASE}/api/search/playlists?query=${encodeURIComponent(corrected)}&limit=12`),
      ])
      if (requestId !== detailRequestIdRef.current) return
      if (!songResponse.ok || !albumResponse.ok || !playlistResponse.ok) throw new Error('Search request failed')
      const songData = await songResponse.json()
      const albumData = await albumResponse.json()
      const playlistData = await playlistResponse.json()
      if (requestId !== detailRequestIdRef.current) return
      const songResults = (songData?.data?.results || []).map(cleanSong)
      const albumResults = (albumData?.data?.results || []).map((item: any) => ({
        id: item.id,
        title: item.name || item.title,
        artist: item.artists?.primary?.map((artist: any) => artist.name).join(', ') || item.language || 'Various Artists',
        image: item.image?.find((image: any) => image.quality === '500x500')?.url || item.image?.at(-1)?.url || '',
        year: String(item.year || ''),
      }))
      const playlistResults = (playlistData?.data?.results || []).map((item: any) => ({
        id: item.id,
        title: item.name || item.title || 'Music Playlist',
        image: item.image?.find((image: any) => image.quality === '500x500')?.url || item.image?.at(-1)?.url || '',
        songCount: Number(item.songCount || item.count || item.more_info?.song_count) || 0,
        officialUrl: typeof item.url === 'string' && item.url.startsWith('https://www.jiosaavn.com/') ? item.url : undefined,
      }))
      setSongs(songResults)
      setAlbums(albumResults)
      setSearchPlaylists(playlistResults)
    } catch {
      if (requestId !== detailRequestIdRef.current) return
      setSongs([])
      setAlbums([])
      setSearchPlaylists([])
      setSearchError('Search failed. Check your connection and try again.')
    } finally {
      if (requestId === detailRequestIdRef.current) setSearching(false)
    }
  }

  const toggleLike = (song: Song) => {
    setLikedSongs((previous) => (
      previous.some((liked) => liked.id === song.id)
        ? previous.filter((liked) => liked.id !== song.id)
        : [song, ...previous]
    ))
  }

  const isLiked = (song: Song) => likedSongs.some((liked) => liked.id === song.id)

  const setPlayerVolume = (nextVolume: number) => {
    setVolume(nextVolume)
    if (nextVolume > 0) {
      lastVolumeRef.current = nextVolume
      setMuted(false)
    } else {
      setMuted(true)
    }
  }

  const prepareAudioVisualizer = (audio: HTMLAudioElement) => {
    if (!window.AudioContext) return

    if (!audioContextRef.current) {
      try {
        audio.crossOrigin = 'anonymous'
        const audioContext = new window.AudioContext()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.78

        const source = audioContext.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(audioContext.destination)
        audioContextRef.current = audioContext
        analyserRef.current = analyser
        setVisualizerReady(true)
      } catch (error) {
        console.error('Unable to initialize the audio visualizer.', error)
        return
      }
    }

    if (audioContextRef.current?.state === 'suspended') {
      void audioContextRef.current.resume().catch((error: unknown) => {
        console.error('Unable to resume the audio visualizer.', error)
        setVisualizerReady(false)
      })
    }
  }

  const toggleMute = () => {
    if (muted || volume === 0) {
      const restoredVolume = lastVolumeRef.current || 75
      setVolume(restoredVolume)
      setMuted(false)
    } else {
      lastVolumeRef.current = volume
      setMuted(true)
    }
  }

  const playSong = (song: Song, playlist?: Song[]) => {
    if (playlist) setSongs(playlist)
    setCurrent(song)
    setProgress(0)
    setPlaybackError('')
    const audio = audioRef.current
    if (!audio || !song.url) {
      audio?.pause()
      setPlaying(false)
      setPlaybackError('This track has no playable audio stream.')
      return
    }

    prepareAudioVisualizer(audio)
    if (audio.src !== song.url) {
      audio.src = song.url
      audio.load()
    }
    void audio.play().catch(() => {
      setPlaying(false)
      setPlaybackError('This audio stream could not be played in this browser.')
    })
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.src) {
      playSong(current)
      return
    }
    if (audio.paused) {
      try {
        prepareAudioVisualizer(audio)
        await audio.play()
      } catch {
        setPlaying(false)
        setPlaybackError('This audio stream could not be played in this browser.')
      }
    } else {
      audio.pause()
    }
  }

  const openAlbum = async (album: AlbumItem) => {
    const requestId = ++detailRequestIdRef.current
    setQuery(album.title)
    setActiveAlbum(album)
    setActivePlaylist(null)
    setActiveNav('Album')
    setSongs([])
    setSearchError('')
    setSearching(true)
    try {
      const response = await fetch(`${API_BASE}/api/albums?id=${encodeURIComponent(album.id)}`)
      if (requestId !== detailRequestIdRef.current) return
      if (!response.ok) throw new Error('Album request failed')
      const data = await response.json()
      if (requestId !== detailRequestIdRef.current) return
      const albumData = data?.data
      const albumSongs = (albumData?.songs || []).map(cleanSong)
      if (albumSongs.length) {
        setSongs(albumSongs)
        setActiveAlbum({
          ...album,
          title: albumData.name || albumData.title || album.title,
          artist: albumData.artists?.primary?.map((artist: any) => artist.name).join(', ') || album.artist,
          year: String(albumData.year || album.year),
        })
        playSong(albumSongs[0])
      } else {
        setSearchError('This album has no tracks available.')
      }
    } catch {
      if (requestId !== detailRequestIdRef.current) return
      setSongs([])
      setSearchError('Could not load this album. Please try again later.')
    } finally {
      if (requestId === detailRequestIdRef.current) setSearching(false)
    }
  }

  const openPlaylist = async (playlist: PlaylistItem) => {
    const requestId = ++detailRequestIdRef.current
    setQuery(playlist.title)
    setActiveAlbum(null)
    setActivePlaylist(playlist)
    setActiveNav('Playlist')
    setSongs([])
    setSearchError('')
    setSearching(true)
    try {
      const pageSize = 50
      const seenSongIds = new Set<string>()
      const playlistSongs: Song[] = []
      let playlistData: any = null
      let page = 1
      while (true) {
        const response = await fetch(`${API_BASE}/api/playlists?id=${encodeURIComponent(playlist.id)}&limit=${pageSize}&page=${page}`)
        if (requestId !== detailRequestIdRef.current) return
        if (!response.ok) throw new Error('Playlist request failed')
        const data = await response.json()
        if (requestId !== detailRequestIdRef.current) return
        if (page === 1) playlistData = data?.data
        const pageSongs: Song[] = (data?.data?.songs || []).map(cleanSong)
        const newSongs = pageSongs.filter((song) => !seenSongIds.has(song.id))
        newSongs.forEach((song) => seenSongIds.add(song.id))
        playlistSongs.push(...newSongs)
        if (!pageSongs.length || pageSongs.length < pageSize || !newSongs.length) break
        page += 1
      }
      if (requestId !== detailRequestIdRef.current) return
      if (!playlistSongs.length) {
        setSearchError('This playlist has no tracks available.')
        return
      }
      setSongs(playlistSongs)
      setActivePlaylist({
        ...playlist,
        title: playlistData.name || playlistData.title || playlist.title,
        songCount: playlistSongs.length,
      })
      playSong(playlistSongs[0])
    } catch {
      if (requestId !== detailRequestIdRef.current) return
      setSongs([])
      setSearchError('Could not load this playlist. Please try again later.')
    } finally {
      if (requestId === detailRequestIdRef.current) setSearching(false)
    }
  }

  const loadPodcastPlaylists = async () => {
    setPodcastsLoading(true)
    setPodcastsError('')
    try {
      const response = await fetch(`${API_BASE}/api/search/playlists?query=podcast&limit=24`)
      if (!response.ok) throw new Error('Podcast playlist request failed')
      const data = await response.json()
      const matches = (data?.data?.results || [])
        .filter((item: any) => /podcast/i.test(item.name || item.title || ''))
        .map((item: any) => ({
          id: item.id,
          title: item.name || item.title || 'Podcast Playlist',
          image: item.image?.find((image: any) => image.quality === '500x500')?.url || item.image?.at(-1)?.url || '',
          songCount: Number(item.songCount || item.count || item.more_info?.song_count) || 0,
          officialUrl: typeof item.url === 'string' && item.url.startsWith('https://www.jiosaavn.com/') ? item.url : undefined,
        }))
      setPodcastPlaylists(matches)
      if (!matches.length) setPodcastsError('No podcast playlists are available for this search.')
    } catch {
      setPodcastPlaylists([])
      setPodcastsError('Could not load podcast playlists. Please try again later.')
    } finally {
      setPodcastsLoading(false)
    }
  }

  const startCast = async () => {
    setCastError('')
    const chromeCast = (window as any).chrome?.cast
    const castFramework = (window as any).cast?.framework
    const receiverApplicationId = chromeCast?.media?.DEFAULT_MEDIA_RECEIVER_APP_ID
    const autoJoinPolicy = chromeCast?.AutoJoinPolicy?.ORIGIN_SCOPED
    if (!receiverApplicationId || !autoJoinPolicy || !castFramework?.CastContext) {
      setCastError('Casting needs Chrome and an available Cast device.')
      return
    }
    try {
      const context = castFramework.CastContext.getInstance()
      context.setOptions({ receiverApplicationId, autoJoinPolicy })
      await context.requestSession()
      const session = context.getCurrentSession()
      if (!session) throw new Error('No Cast session is available.')
      if (!current.url) throw new Error('Choose a playable track before casting.')
      const contentType = current.url.toLowerCase().endsWith('.mp4') ? 'audio/mp4' : 'audio/mpeg'
      const mediaInfo = new chromeCast.media.MediaInfo(current.url, contentType)
      const metadata = new chromeCast.media.MusicTrackMediaMetadata()
      metadata.title = current.name
      metadata.artist = current.artist
      metadata.albumName = current.album
      mediaInfo.metadata = metadata
      await session.loadMedia(new chromeCast.media.LoadRequest(mediaInfo))
      setCastSession(session)
      setCastError('')
    } catch (error) {
      setCastSession(null)
      setCastError(error instanceof Error ? error.message : 'Could not start casting. Try again.')
    }
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

  const currentSongIndex = songs.findIndex((song) => song.id === current.id)
  const upcomingSongs = songs.length > 1
    ? Array.from({ length: Math.min(3, songs.length - 1) }, (_, index) => songs[(currentSongIndex + index + 1 + songs.length) % songs.length])
    : []

  const fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect width="500" height="500" fill="%232d2d36"/%3E%3Ccircle cx="250" cy="250" r="120" fill="none" stroke="%23ec3b6a" stroke-width="18"/%3E%3Ccircle cx="250" cy="250" r="32" fill="%23ec3b6a"/%3E%3C/svg%3E'

  const renderSongCard = (song: Song, index: number, playlist: Song[] = songs) => (
    <article className="js-song" key={`${song.id}-${index}`}>
      <div className="js-cover">
        <img src={song.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt={song.name} />
        <button
          aria-label={current.id === song.id && playing ? `Pause ${song.name}` : `Play ${song.name}`}
          onClick={() => {
            if (playlist) setSongs(playlist)
            if (current.id === song.id && playing) void togglePlay()
            else playSong(song, playlist)
          }}
        >{current.id === song.id && playing ? 'Ⅱ' : '▶'}</button>
        <button
          className={`js-like-button${isLiked(song) ? ' liked' : ''}`}
          aria-label={isLiked(song) ? `Unlike ${song.name}` : `Like ${song.name}`}
          aria-pressed={isLiked(song)}
          onClick={() => toggleLike(song)}
        >♥</button>
      </div>
      <h3>{song.name}</h3>
      <p>{song.artist}</p>
    </article>
  )

  const handleNavigation = (label: string) => {
    detailRequestIdRef.current += 1
    setSearching(false)
    setActiveNav(label)
    if (label === 'Home') {
      setActiveAlbum(null)
      setActivePlaylist(null)
      setSongs(homeSongs)
    }
    if (label === 'Search') setQuery(query || '')
    if (label === 'Browse') void search(query || 'hindi', 'Browse')
    if (label === 'Radio') void search(query || 'radio hits', 'Radio')
    if (label === 'Podcasts') void loadPodcastPlaylists()
    if (label === 'Library') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`js-app${darkMode ? ' dark' : ''}`}>
      <aside className="js-sidebar">
        <div className="js-nav-group">
          <span className="js-nav-heading">Browse</span>
          <nav>
          {[
            ['Home', '⌂'], ['Browse', '⊞'], ['Radio', '◉'], ['Podcasts', '◌'], ['Search', '⌕']
          ].map(([label, icon]) => (
            <button
              key={label}
              className={activeNav === label ? 'active' : ''}
              onClick={() => handleNavigation(label)}
            ><span>{icon}</span>{label}</button>
          ))}
          </nav>
        </div>
        <div className="js-nav-group js-library-nav">
          <span className="js-nav-heading">Library</span>
          <nav><button className={activeNav === 'Library' ? 'active' : ''} onClick={() => handleNavigation('Library')}><span>▰</span>Library</button></nav>
        </div>
        <div className="js-user"><div>{accountName ? accountName.slice(0, 2).toUpperCase() : 'S'}</div><span><b>{accountName || 'Guest'}</b><small>{accountName ? 'Local profile' : 'Free account'}</small></span></div>
      </aside>

      <main className="js-main">
        <header className="js-header">
          <a className="js-header-brand" href="/" onClick={(event) => { event.preventDefault(); handleNavigation('Home') }}><img src="/stream-mark.svg" alt="" /><b>Stream</b></a>
          <nav className="js-top-nav">
            <button className={activeNav === 'Home' ? 'active' : ''} onClick={() => handleNavigation('Home')}>Music</button>
            <button className={activeNav === 'Podcasts' ? 'active' : ''} onClick={() => handleNavigation('Podcasts')}>Podcasts</button>
          </nav>
          <div className="js-search-wrap">
            <label className="js-search"><span>⌕</span><input value={query} onChange={(event) => updateSuggestions(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && search(query)} placeholder="Search songs, albums, artists" /></label>
            {suggestions.length > 0 && <div className="js-suggestions">{suggestions.slice(0, 6).map((suggestion) => <button key={suggestion} onClick={() => search(suggestion)}>⌕ &nbsp; {suggestion}</button>)}</div>}
          </div>
          <button className="js-language">English</button>
          <button className="js-theme-toggle" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={darkMode} onClick={() => setDarkMode((previous) => !previous)}>{darkMode ? '☀' : '☾'}</button>
          <button className="js-user-avatar" onClick={() => { setAuthError(''); setLoginOpen(true) }}>{accountName ? accountName.slice(0, 2).toUpperCase() : 'Login'}</button>
        </header>

        {activeNav === 'Home' ? (
          <>
            <section className="js-hero">
              <div className="js-hero-copy">
                <span>YOUR DAILY MIX</span>
                <h1>Music that feels<br />like you</h1>
                <p>Discover songs, albums and artists handpicked for you.</p>
                <button onClick={() => homeSongs[0] && playSong(homeSongs[0], homeSongs)}>▶ &nbsp; Play</button>
              </div>
              <div className="js-hero-art">
                {current.image ? <img src={current.image} onError={(event) => { event.currentTarget.src = fallback }} alt="" /> : <img src={fallback} alt="" />}
              </div>
            </section>

            <section className="js-weather-panel" aria-label="Local date, time and weather">
              <div className="js-weather-clock">
                <span className="js-weather-eyebrow">{accountName ? `WELCOME, ${accountName}` : 'WELCOME TO STREAM'}</span>
                <time dateTime={clockNow.toISOString()} className="js-weather-time">
                  {clockNow.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: localWeather?.timezone }).split(/(:)/).map((part, index) => (
                    part === ':' ? <span className="js-weather-time-colon" key={index}>{part}</span> : part
                  ))}
                </time>
                <span className="js-weather-date">
                  {clockNow.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: localWeather?.timezone })}
                </span>
                <span className="js-weather-location"><span aria-hidden="true">⌖</span> {localWeather?.location || 'Location not set'}</span>
                {localWeather && <span className="js-weather-location-details">{localWeather.details}</span>}
              </div>
              {localWeather ? (
                <div className="js-weather-content">
                  <div className="js-weather-current">
                    <span className={`js-weather-scene js-weather-scene--${weatherAnimation(localWeather.code)} ${localWeather.isDay ? 'is-day' : 'is-night'}`} aria-hidden="true">
                      <span className="js-weather-scene-sun" />
                      <span className="js-weather-scene-cloud js-weather-scene-cloud--back" />
                      <span className="js-weather-scene-cloud js-weather-scene-cloud--front" />
                      <span className="js-weather-scene-rain"><i /><i /><i /></span>
                      <span className="js-weather-scene-snow"><i>✦</i><i>✦</i><i>✦</i></span>
                      <span className="js-weather-scene-lightning">⚡</span>
                      <span className="js-weather-scene-fog"><i /><i /><i /></span>
                    </span>
                    <div>
                      <strong>{Math.round(localWeather.temperature)}°</strong>
                      <span>{weatherDescription(localWeather.code)} · Feels like {Math.round(localWeather.feelsLike)}°</span>
                    </div>
                    <button className="js-weather-refresh" onClick={requestLocalWeather} disabled={weatherLoading}>
                      {weatherLoading ? 'Locating…' : 'Use precise location'}
                    </button>
                  </div>
                  <div className="js-weather-forecast" aria-label="Four day forecast">
                    {localWeather.forecast.map((day, index) => (
                      <div className="js-weather-day" key={day.date}>
                        <span>{index === 0 ? 'Today' : new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${day.date}T12:00:00Z`))}</span>
                        <span className={`js-weather-day-symbol js-weather-day-symbol--${weatherAnimation(day.code)}`} aria-hidden="true">{weatherSymbol(day.code)}</span>
                        <span>{Math.round(day.high)}° <small>{Math.round(day.low)}°</small></span>
                      </div>
                    ))}
                  </div>
                  {localWeather.locationNote && <p className="js-weather-note">{localWeather.locationNote}</p>}
                  {weatherError && <p className="js-weather-error" role="alert">{weatherError}</p>}
                </div>
              ) : (
                <div className="js-weather-prompt">
                  <div>
                    <strong>{weatherError ? 'Weather unavailable' : weatherLoading ? 'Finding your approximate location…' : 'See your local forecast'}</strong>
                    <p>{weatherError ? 'Use precise device location or reload to retry the approximate lookup.' : 'Your public IP is used to estimate your location. It is sent to the location service; this app does not save it. A VPN may affect the estimate.'}</p>
                  </div>
                  <button onClick={requestLocalWeather} disabled={weatherLoading}>
                    {weatherLoading ? 'Finding location…' : 'Use precise location'}
                  </button>
                  {weatherError && <span className="js-weather-error" role="alert">{weatherError}</span>}
                </div>
              )}
            </section>

            <section className="js-section">
              <div className="js-section-title"><div><span>{homePlaylistTitle}</span><h2>Trending Now</h2></div><button onClick={() => search('latest hindi songs')}>See all</button></div>
              {searching && <div className="js-loading">Loading music…</div>}
              {searchError && <p className="js-search-error" role="alert">{searchError}</p>}
              <div className="js-songs">
                {homeSongs.slice(0, 12).map((song, index) => renderSongCard(song, index, homeSongs))}
              </div>
            </section>

            <section className="js-section js-playlists-section">
              <div className="js-section-title"><div><span>Curated for you</span><h2>Top Playlists</h2></div></div>
              <div className="js-albums js-playlists">
                {playlists.slice(0, 12).map((playlist) => (
                  <article className="js-album js-playlist" key={playlist.id} onClick={() => openPlaylist(playlist)}>
                    <div><img src={playlist.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt={playlist.title} /><button aria-label={`Play ${playlist.title}`} onClick={(event) => { event.stopPropagation(); void openPlaylist(playlist) }}>▶</button></div>
                    <h3>{playlist.title}</h3><p>Playlist{playlist.songCount ? ` • ${playlist.songCount} songs` : ''}</p>
                  </article>
                ))}
              </div>
              {!playlists.length && !searching && <p className="js-empty-state">Playlists are currently unavailable.</p>}
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
              <span>{activeNav === 'Library' ? 'YOUR COLLECTION' : activeNav === 'Podcasts' ? 'SHOWS & EPISODES' : activeNav === 'Album' ? 'ALBUM DETAILS' : activeNav === 'Playlist' ? 'PLAYLIST' : 'DISCOVER'}</span>
              <h1>{activeNav === 'Album' ? activeAlbum?.title || 'Album' : activeNav === 'Playlist' ? activePlaylist?.title || 'Playlist' : activeNav}</h1>
              <p>{activeNav === 'Radio' ? 'Live-style stations from your favourite moods and artists.' : activeNav === 'Podcasts' ? 'Podcast collections and playlists.' : activeNav === 'Library' ? 'Quick access to your liked songs and albums.' : activeNav === 'Album' ? `${activeAlbum?.artist || 'Various Artists'}${activeAlbum?.year ? ` • ${activeAlbum.year}` : ''}` : activeNav === 'Playlist' ? searching ? 'Loading playlist tracks…' : `${activePlaylist?.songCount || songs.length} tracks • Curated playlist` : 'Explore music, albums, artists and playlists.'}</p>
            </div>

            {(activeNav === 'Album' || activeNav === 'Playlist') && (
              <>
                {activeNav === 'Album' && activeAlbum && (
                  <section className="js-album-detail">
                    <div className="js-record spinning"><img src={activeAlbum.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt={`${activeAlbum.title} album artwork`} /></div>
                    <div className="js-album-detail-copy">
                      <span>NOW PLAYING FROM THIS ALBUM</span>
                      <h2>{activeAlbum.title}</h2>
                      <p>{activeAlbum.artist}{activeAlbum.year ? ` • ${activeAlbum.year}` : ''}</p>
                      <button onClick={() => songs[0] && (current.id === songs[0].id ? void togglePlay() : playSong(songs[0], songs))}>▶ &nbsp; Play album</button>
                    </div>
                  </section>
                )}
                {searching && <div className="js-loading" role="status">Loading {activeNav === 'Playlist' ? 'playlist' : 'album'} tracks…</div>}
                <div className="js-section-title"><div><span>{activeNav === 'Playlist' ? 'PLAYLIST TRACKLIST' : 'ALBUM TRACKLIST'}</span><h2>{searching ? 'Loading…' : `${songs.length} tracks`}</h2></div><button onClick={() => handleNavigation('Home')}>Back to home</button></div>
                {searchError && <p className="js-search-error" role="alert">{searchError}</p>}
                <div className="js-songs">{songs.map((song, index) => renderSongCard(song, index, songs))}</div>
                {!songs.length && !searching && !searchError && <p className="js-empty-state">No tracks are available for this album.</p>}
              </>
            )}

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
              <>
              <div className="js-library-grid">
                <button onClick={() => setShowLikedSongs((previous) => !previous)}><span>♥</span><b>Liked Songs</b><small>{likedSongs.length} songs</small></button>
                <button onClick={() => search('hindi albums')}><span>▰</span><b>Recently Played</b><small>Continue listening</small></button>
                <button onClick={() => search('hindi')}><span>＋</span><b>My Albums</b><small>{albums.length} saved</small></button>
              </div>
              {showLikedSongs && (
                <section className="js-section">
                  <div className="js-section-title"><div><span>YOUR COLLECTION</span><h2>Liked Songs</h2></div><button onClick={() => setShowLikedSongs(false)}>Close</button></div>
                  {likedSongs.length
                    ? <div className="js-songs">{likedSongs.map((song, index) => renderSongCard(song, index, likedSongs))}</div>
                    : <p className="js-empty-state">No liked songs yet. Tap the heart on a song to save it here.</p>}
                </section>
              )}
              </>
            )}

            {activeNav === 'Podcasts' && (
              <section className="js-section js-podcast-page">
                <div className="js-section-title"><div><span>Curated collections</span><h2>Podcast Playlists</h2></div><button onClick={() => void loadPodcastPlaylists()}>Refresh</button></div>
                {podcastsLoading && <div className="js-loading">Loading podcast playlists…</div>}
                {podcastsError && <p className="js-search-error" role="alert">{podcastsError}</p>}
                <div className="js-albums js-podcast-playlists">
                  {podcastPlaylists.map((playlist) => (
                    <article className="js-album" key={playlist.id} onClick={() => openPlaylist(playlist)}>
                      <div><img src={playlist.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt={playlist.title} /><button aria-label={`Open ${playlist.title}`}>▶</button></div>
                      <h3>{playlist.title}</h3><p>Playlist{playlist.songCount ? ` • ${playlist.songCount} songs` : ''}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {searching && ['Search', 'Browse', 'Radio'].includes(activeNav) && <div className="js-loading">Loading music…</div>}
            {(activeNav === 'Search' || activeNav === 'Browse' || activeNav === 'Radio') && (
              <>
                <div className="js-section-title"><div><span>Results</span><h2>{query ? `Search: ${query}` : 'Explore Music'}</h2></div></div>
                {searchError && <p className="js-search-error" role="alert">{searchError}</p>}
                {!searchError && songs.length > 0 && <div className="js-songs">{songs.slice(0, 12).map((song, index) => renderSongCard(song, index, songs))}</div>}
                {!searchError && albums.length > 0 && (
                  <section className="js-section">
                    <div className="js-section-title"><div><span>Music catalog</span><h2>Albums</h2></div></div>
                    <div className="js-albums">
                      {albums.slice(0, 12).map((album) => (
                        <article className="js-album" key={album.id} onClick={() => openAlbum(album)}>
                          <div><img src={album.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt={album.title} /><button aria-label={`Open ${album.title}`}>▶</button></div>
                          <h3>{album.title}</h3><p>{album.artist}{album.year ? ` • ${album.year}` : ''}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
                {!searchError && searchPlaylists.length > 0 && (
                  <section className="js-section">
                    <div className="js-section-title"><div><span>Music catalog</span><h2>Playlists</h2></div></div>
                    <div className="js-albums">
                      {searchPlaylists.slice(0, 12).map((playlist) => (
                        <article className="js-album" key={playlist.id} onClick={() => openPlaylist(playlist)}>
                          <div><img src={playlist.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt={playlist.title} /><button aria-label={`Open ${playlist.title}`}>▶</button></div>
                          <h3>{playlist.title}</h3><p>Playlist{playlist.songCount ? ` • ${playlist.songCount} songs` : ''}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
                {!searching && !searchError && !songs.length && !albums.length && !searchPlaylists.length && <p className="js-empty-state">No results found. Try another search.</p>}
              </>
            )}
          </section>
        )}

        <section className="js-mood-bar">
          <div><span>MOOD & SINGER</span><h2>Made for {mood}</h2></div>
          <div className="js-moods">
            {['Romance', 'Happy', 'Sad', 'Party', 'Workout', 'Chill'].map((item) => <button key={item} className={mood === item ? 'active' : ''} onClick={() => { setMood(item); void search(`${item} hindi songs`) }}>{item}</button>)}
          </div>
          <div className="js-singer-chips">
            {['Arijit Singh', 'Pritam', 'Shreya Ghoshal', 'Neha Kakkar', 'Atif Aslam'].map((singer) => <button key={singer} onClick={() => search(singer)}>♬ &nbsp; {singer}</button>)}
          </div>
        </section>
      </main>

      <aside className="js-queue">
        <div className="js-queue-heading"><div><span>UP NEXT</span><h2>Queue</h2></div><b>{songs.length}</b></div>
        <div className="js-queue-list">
          {songs.slice(0, 12).map((song, index) => (
            <button className={current.id === song.id ? 'active' : ''} key={`${song.id}-${index}`} onClick={() => playSong(song, songs)}>
              <img src={song.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt="" />
              <span><b>{song.name}</b><small>{song.artist}</small></span>
              <i>{current.id === song.id && playing ? 'Ⅱ' : '▶'}</i>
            </button>
          ))}
          {!songs.length && <p className="js-queue-empty">Play a song to start your queue.</p>}
        </div>
      </aside>

      <footer className="js-player">
        <div className="js-now">
          <button
            className={`js-now-disc${playing ? ' is-playing' : ''}`}
            aria-label={`Open full-screen player for ${current.name}`}
            onClick={() => setFullPlayerOpen(true)}
          >
            <img src={current.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt="" />
          </button>
          <div><h3>{current.name}</h3><p className={playbackError ? 'js-playback-error' : ''}>{playbackError || current.artist}</p>{current.officialUrl && <a className="js-song-official" href={current.officialUrl} target="_blank" rel="noopener noreferrer" title="Open official listening and offline options">Official listening options</a>}</div>
          <button className={isLiked(current) ? 'liked' : ''} aria-label={isLiked(current) ? 'Unlike current song' : 'Like current song'} aria-pressed={isLiked(current)} onClick={() => toggleLike(current)}>♥</button>
        </div>
        <div className="js-player-center">
          <div className="js-controls">
            <button aria-label="Previous track" onClick={previous}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M19 6l-9 6 9 6V6Z" /></svg></button>
            <button className="main" aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>{playing ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM15 5h3v14h-3z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" /></svg>}</button>
            <button aria-label="Next track" onClick={next}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M5 6l9 6-9 6V6Z" /></svg></button>
          </div>
          <div className="js-timeline"><span>{formatTime(progress / 100 * current.duration)}</span><input type="range" min="0" max="100" value={progress} onChange={(event) => seek(Number(event.target.value))} /><span>{formatTime(current.duration)}</span></div>
        </div>
        <div className="js-tools">
          <button title="Cast" aria-label="Cast audio" className={castSession ? 'casting' : ''} onClick={startCast}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17a3 3 0 0 1 3 3M4 12a8 8 0 0 1 8 8M4 7a13 13 0 0 1 13 13M4 4h16v13" /></svg></button>
          <button
            className="js-visualizer-toggle"
            title={`Visualizer: ${visualizerMode}`}
            aria-label={`Visualizer: ${visualizerMode}. Activate to change mode`}
            aria-pressed={visualizerMode !== 'off'}
            onClick={() => setVisualizerMode(visualizerMode === 'bars' ? 'ring' : visualizerMode === 'ring' ? 'off' : 'bars')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-4M8 18V6m4 14V4m4 14V6m4 8v-4" /></svg>
          </button>
          <div className="js-volume-control">
            <button className={`js-volume-toggle${muted || volume === 0 ? ' muted' : ''}`} onClick={toggleMute} aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'} aria-pressed={muted || volume === 0} title={muted || volume === 0 ? 'Unmute' : 'Mute'}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
                {muted || volume === 0
                  ? <path d="m17 9 5 6m0-6-5 6" />
                  : <path d="M16 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12" />}
              </svg>
            </button>
            <input className="js-volume-slider" type="range" min="0" max="100" value={muted ? 0 : volume} onChange={(event) => setPlayerVolume(Number(event.target.value))} aria-label="Volume" aria-valuetext={`${muted ? 0 : volume}%`} />
            <span className="js-volume-value">{muted ? 0 : volume}%</span>
          </div>
        </div>
      </footer>
      {castError && <p className="js-cast-error" role="status">{castError}</p>}

      {fullPlayerOpen && (
        <section className="js-full-player" role="dialog" aria-modal="true" aria-label="Now playing">
          <button className="js-full-player-close" aria-label="Close full-screen player" onClick={() => setFullPlayerOpen(false)}>×</button>
          <div className="js-full-player-layout">
            <div className={`js-full-player-record${playing ? ' is-playing' : ''}`} aria-hidden="true">
              <img src={current.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt="" />
            </div>
            <div className="js-full-player-info">
              <span>NOW PLAYING</span>
              <h1>{current.name}</h1>
              <p>{current.artist}</p>
              <small>{current.album}</small>
              {current.officialUrl && <a href={current.officialUrl} target="_blank" rel="noopener noreferrer">Official listening options</a>}
              <section className="js-full-player-up-next" aria-label="Up next">
                <div className="js-full-player-up-next-heading">
                  <span>UP NEXT</span>
                  <small>{upcomingSongs.length ? `${upcomingSongs.length} tracks` : 'Queue complete'}</small>
                </div>
                {upcomingSongs.length
                  ? <div className="js-full-player-up-next-list">
                    {upcomingSongs.map((song, index) => (
                      <button key={`${song.id}-${index}`} onClick={() => playSong(song, songs)} aria-label={`Play ${song.name} next`}>
                        <img src={song.image || fallback} onError={(event) => { event.currentTarget.src = fallback }} alt="" />
                        <span><b>{song.name}</b><small>{song.artist}</small></span>
                        <i aria-hidden="true">▶</i>
                      </button>
                    ))}
                  </div>
                  : <p className="js-full-player-up-next-empty">No upcoming tracks in this queue.</p>}
              </section>
            </div>
          </div>
          <div className="js-full-player-controls">
            <div className="js-full-player-timeline">
              <span>{formatTime(progress / 100 * current.duration)}</span>
              <input type="range" min="0" max="100" value={progress} onChange={(event) => seek(Number(event.target.value))} aria-label="Track position" />
              <span>{formatTime(current.duration)}</span>
            </div>
            <div className="js-full-player-control-row">
              <button aria-label="Previous track" onClick={previous}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M19 6l-9 6 9 6V6Z" /></svg></button>
              <button className="main" aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>
                {playing ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM15 5h3v14h-3z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" /></svg>}
              </button>
              <button aria-label="Next track" onClick={next}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M5 6l9 6-9 6V6Z" /></svg></button>
              <div className="js-full-player-volume">
                <button aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'} aria-pressed={muted || volume === 0} onClick={toggleMute}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
                    {muted || volume === 0 ? <path d="m17 9 5 6m0-6-5 6" /> : <path d="M16 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12" />}
                  </svg>
                </button>
                <input type="range" min="0" max="100" value={muted ? 0 : volume} onChange={(event) => setPlayerVolume(Number(event.target.value))} aria-label="Volume" aria-valuetext={`${muted ? 0 : volume}%`} />
              </div>
            </div>
          </div>
        </section>
      )}

      {loginOpen && (
        <div className="js-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginOpen(false) }}>
          <div className="js-login-modal">
            <button className="js-modal-close" onClick={() => setLoginOpen(false)}>×</button>
            <div className="js-login-logo"><img src="/stream-mark.svg" alt="" /></div>
            <h2>Welcome to Stream</h2>
            <p>Your profile and liked songs stay in this browser only. They are not encrypted, so use a private device.</p>
            <label>Name<input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Your name" /></label>
            <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@example.com" /></label>
            {authError && <p className="js-auth-error" role="alert">{authError}</p>}
            <button className="js-login-submit" onClick={() => {
              if (!accountName.trim()) {
                setAuthError('Enter your name to continue.')
                return
              }
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                setAuthError('Enter a valid email address.')
                return
              }
              localStorage.setItem('stream-account', accountName.trim())
              localStorage.setItem('stream-email', email.trim())
              setAuthError('')
              setLoginOpen(false)
            }}>Save profile</button>
            <div className="js-login-divider"><span>or</span></div>
            <button className="js-google" onClick={() => setAuthError('Google sign-in is not configured for this app yet.')}>G &nbsp; Continue with Google</button>
          </div>
        </div>
      )}

      {visualizerMode !== 'off' && <div ref={visualizerRef} className={`js-visualizer ${visualizerMode}${playing ? ' is-playing' : ''}${visualizerReady ? ' has-analyser' : ''}`} aria-hidden="true">{Array.from({ length: 32 }).map((_, index) => <i key={index} style={{ '--i': index, '--delay': `${(index % 16) * -0.045}s` } as CSSProperties} />)}</div>}

      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onPlay={() => { setPlaying(true); setPlaybackError('') }}
        onPause={() => setPlaying(false)}
        onError={() => { setPlaying(false); setPlaybackError('This audio stream could not be played in this browser.') }}
        onTimeUpdate={(event) => setProgress((event.currentTarget.currentTime / (event.currentTarget.duration || current.duration)) * 100)}
        onEnded={next}
      />
    </div>
  )
}

export default JioStream
