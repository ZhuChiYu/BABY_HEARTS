import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Moon, Volume2, Clock } from 'lucide-react'

function SleepModePlayer({ heartbeatData }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMode, setCurrentMode] = useState('lullaby')
  const [volume, setVolume] = useState(0.6)
  const [duration, setDuration] = useState(30) // 播放时长（分钟）
  const [timeLeft, setTimeLeft] = useState(0)
  
  const audioRef = useRef(null)
  const timerRef = useRef(null)

  // 安抚模式配置
  const sleepModes = {
    lullaby: {
      name: '摇篮曲',
      icon: '🎵',
      description: '温柔的摇篮曲，营造安静的睡眠环境',
      color: 'blue',
      playlist: [
        { name: '美女与野兽', url: '/audio/sleep/lullaby/手嶌葵 - Beauty And The Beast.mp3' },
        { name: '时之歌(哈尔的移动城堡)', url: '/audio/sleep/lullaby/手嶌葵 - 時の歌(ゲド戦記).mp3' },
        { name: '明日への手紙', url: '/audio/sleep/lullaby/手嶌葵 - 明日への手紙.mp3' },
        { name: '天使', url: '/audio/sleep/lullaby/手嶌葵 - Angel.mp3' },
        { name: '辉きの庭', url: '/audio/sleep/lullaby/手嶌葵 - 輝きの庭～I\'m not alone～.mp3' },
        { name: '彩虹', url: '/audio/sleep/lullaby/手嶌葵 - 虹.mp3' },
        { name: '初恋的顷', url: '/audio/sleep/lullaby/手嶌葵 - 初恋の顷.mp3' },
        { name: '雪の降るまちを', url: '/audio/sleep/lullaby/手嶌葵 - 雪の降るまちを.mp3' },
        { name: '魔法咒语', url: '/audio/sleep/lullaby/手嶌葵 - Bibbidi Bobbidi Boo.mp3' },
        { name: '阿尔菲', url: '/audio/sleep/lullaby/手嶌葵 - Alfie.mp3' },
        { name: '温柔回忆', url: '/audio/sleep/lullaby/our-memories-313882.mp3' },
        { name: '钢琴摇篮曲', url: '/audio/sleep/lullaby/piano-for-babies-344928.mp3' },
        { name: '安眠摇篮曲', url: '/audio/sleep/lullaby/para-ashley-cancion-de-cuna-146063.mp3' },
        { name: '勃拉姆斯摇篮曲', url: '/audio/sleep/lullaby/legacy-of-brahms-lullaby-background-orchestral-music-for-video-3min-274958.mp3' },
        { name: '星光摇篮曲', url: '/audio/sleep/lullaby/twinkle-like-a-star-8026.mp3' },
        { name: '宁静摇篮曲', url: '/audio/sleep/lullaby/lullaby-for-a-frantic-world-144946.mp3' },
        { name: '钢琴睡眠曲', url: '/audio/sleep/lullaby/piano-sleep-music-166440.mp3' },
        { name: '睡眠摇篮曲', url: '/audio/sleep/lullaby/lullaby-sleeping-150140.mp3' },
        { name: '森林摇篮曲', url: '/audio/sleep/lullaby/forest-lullaby-110624.mp3' },
        { name: '星辰摇篮曲', url: '/audio/sleep/lullaby/echoes-of-the-stars-lullaby-music-instrumental-346580.mp3' }
      ]
    },
    heartbeat: {
      name: '胎心+白噪音',
      icon: '💗',
      description: '宝宝的心跳声配合白噪音，最熟悉的安抚声音',
      color: 'pink',
      playlist: [
        { name: '海岛心跳', url: '/audio/sleep/heartbeat/island-heartbeat-211013.mp3' },
        { name: '电子心跳', url: '/audio/sleep/heartbeat/electric-heartbeat-345829.mp3' },
        { name: '心跳小夜曲', url: '/audio/sleep/heartbeat/heartbeat-serenade-292153.mp3' },
        { name: '慢节拍心跳', url: '/audio/sleep/heartbeat/filtered-red-slow-beats-335095.mp3' },
        { name: '冥想心跳音乐', url: '/audio/sleep/heartbeat/pure-theta-4-7hz-heartbeat-and-slow-music-351392.mp3' },
        { name: '时光心跳', url: '/audio/sleep/heartbeat/time-heartbeat-fusion-169017.mp3' }
      ]
    },
    nature: {
      name: '宫崎骏动画音乐',
      icon: '🌿',
      description: '宫崎骏动画配乐和经典钢琴曲，营造宁静氛围',
      color: 'green',
      playlist: [
        { name: '君をのせて (天空之城)', url: '/audio/sleep/nature/君をのせて.mp3' },
        { name: '海の见える街 (魔女宅急便)', url: '/audio/sleep/nature/海の见える街.mp3' },
        { name: '風のとおり道 (龙猫)', url: '/audio/sleep/nature/風のとおり道.mp3' },
        { name: '空から降ってきた少女', url: '/audio/sleep/nature/空から降ってきた少女.mp3' },
        { name: '空中散歩', url: '/audio/sleep/nature/空中散歩.mp3' },
        { name: '旅路(梦中飞行)', url: '/audio/sleep/nature/旅路(梦中飞行).mp3' },
        { name: '安妮的仙境', url: '/audio/sleep/nature/安妮的仙境.mp3' },
        { name: '致艾丽丝', url: '/audio/sleep/nature/致艾丽丝.mp3' },
        { name: '月光奏鸣曲', url: '/audio/sleep/nature/月光奏鸣曲.mp3' },
        { name: '追梦人', url: '/audio/sleep/nature/追梦人.mp3' },
        { name: '那个夏天 - 演唱版', url: '/audio/sleep/nature/那个夏天 - 演唱版.mp3' },
        { name: '梦の星空', url: '/audio/sleep/nature/梦の星空.mp3' },
        { name: '合唱 君をのせて', url: '/audio/sleep/nature/合唱 君をのせて.mp3' },
        { name: '海', url: '/audio/sleep/nature/海.mp3' },
        { name: '风のとおり道', url: '/audio/sleep/nature/风のとおり道.mp3' },
        { name: '风の丘', url: '/audio/sleep/nature/风の丘.mp3' },
        { name: '东から来た少年', url: '/audio/sleep/nature/东から来た少年.mp3' },
        { name: '暗恋者的表白', url: '/audio/sleep/nature/暗恋者的表白.mp3' },
        { name: 'April', url: '/audio/sleep/nature/April.mp3' },
        { name: 'Annie\'s Wonderland', url: '/audio/sleep/nature/Annie\'s Wonderland.mp3' },
        { name: '土耳其进行曲', url: '/audio/sleep/nature/土耳其进行曲.mp3' },
        { name: 'Annie\'s Song', url: '/audio/sleep/nature/Annie\'s Song.mp3' },
        { name: 'An Cient Pom', url: '/audio/sleep/nature/An Cient Pom.mp3' },
        { name: 'After the Rain', url: '/audio/sleep/nature/After the Rain.mp3' },
        { name: 'A Woodland Night', url: '/audio/sleep/nature/A Woodland Night.mp3' },
        { name: '早晨的空气', url: '/audio/sleep/nature/早晨的空气.mp3' },
        { name: '童年记忆', url: '/audio/sleep/nature/童年记忆.mp3' },
        { name: '清晨', url: '/audio/sleep/nature/清晨.mp3' }
      ]
    },
    blessing: {
      name: '睡前音乐',
      icon: '🙏',
      description: '温馨的钢琴曲和轻音乐，表达父母的爱意',
      color: 'yellow',
      playlist: [
        { name: '梁祝', url: '/audio/sleep/blessing/梁祝.mp3' },
        { name: '秋日私语', url: '/audio/sleep/blessing/秋のささやき.mp3' },
        { name: '星空钢琴师', url: '/audio/sleep/blessing/星空のピアニスト.mp3' },
        { name: '爱的纪念', url: '/audio/sleep/blessing/A comme amour(piano and orchestra).mp3' },
        { name: '给爱德琳的诗', url: '/audio/sleep/blessing/Ballade pour Adeline.mp3' },
        { name: '致爱丽丝', url: '/audio/sleep/blessing/Fur Elise (Beethoven).mp3' },
        { name: '我爱你', url: '/audio/sleep/blessing/I Love You.mp3' },
        { name: '回家', url: '/audio/sleep/blessing/Home.mp3' },
        { name: '圣母颂', url: '/audio/sleep/blessing/Ave Maria.mp3' },
        { name: '最好的朋友', url: '/audio/sleep/blessing/Best Friend.mp3' },
        { name: '组曲秋日私语-午后的旅行-梦中的鸟-童年的回忆', url: '/audio/sleep/blessing/组曲秋日私语-午后的旅行-梦中的鸟-童年的回忆.mp3' },
        { name: '离别的真相', url: '/audio/sleep/blessing/The truth that you leave.mp3' },
        { name: '高至豪-离别的真相', url: '/audio/sleep/blessing/高至豪-The Truth That You Leave (Demo).mp3' },
        { name: '高至豪-离别的真相(钢琴曲)', url: '/audio/sleep/blessing/高至豪-The Truth That You Leave (钢琴曲).mp3' },
        { name: '高至豪-雪暴', url: '/audio/sleep/blessing/高至豪-Snow storm.mp3' },
        { name: '高至豪-安静的午后', url: '/audio/sleep/blessing/高至豪-Slience Afternoon.mp3' },
        { name: '高至豪-鸟的诗意', url: '/audio/sleep/blessing/高至豪-Poety of the Bird.mp3' },
        { name: '高至豪-Layee', url: '/audio/sleep/blessing/高至豪-Layee.mp3' },
        { name: '高至豪-咖啡店', url: '/audio/sleep/blessing/高至豪-Doutor coffee shop.mp3' },
        { name: '高至豪-咖啡店(Demo)', url: '/audio/sleep/blessing/高至豪-Doutor coffee shop (Demo).mp3' },
        { name: '高至豪-舞蹈娃娃', url: '/audio/sleep/blessing/高至豪-Dancing Doll.mp3' },
        { name: '高至豪-安娜贝尔', url: '/audio/sleep/blessing/高至豪-Annabelle.mp3' },
        { name: '高至豪-安娜贝尔(Demo)', url: '/audio/sleep/blessing/高至豪-Annabelle (Demo).mp3' },
        { name: '高至豪-Anifled(Demo)', url: '/audio/sleep/blessing/高至豪-Anifled (Demo).mp3' },
        { name: '高至豪-孤独在路上', url: '/audio/sleep/blessing/高至豪-Alone On The Way (Demo).mp3' },
        { name: '高至豪-夏日绿荫', url: '/audio/sleep/blessing/高至豪-夏日绿荫 (Demo).mp3' },
        { name: '高至豪-王者降临', url: '/audio/sleep/blessing/高至豪-王者降临 (Demo).mp3' },
        { name: '高至豪-那年记忆中的追寻', url: '/audio/sleep/blessing/高至豪-那年记忆中的追寻 (Demo).mp3' },
        { name: '高至豪-寂静的跳舞娃娃', url: '/audio/sleep/blessing/高至豪-寂静的跳舞娃娃 (Demo).mp3' },
        { name: '高至豪-复刻回忆', url: '/audio/sleep/blessing/高至豪-复刻回忆 (Demo).mp3' },
        { name: '高至豪-第105天', url: '/audio/sleep/blessing/高至豪-第105天 (Demo).mp3' },
        { name: '高至豪-安静的午后(Demo)', url: '/audio/sleep/blessing/高至豪-安静的午后 (Demo).mp3' },
        { name: '高至豪-105天', url: '/audio/sleep/blessing/高至豪-105Days.mp3' },
        { name: 'Histoire d\'Lln Reve', url: '/audio/sleep/blessing/Histoire d\'Lln Reve.mp3' },
        { name: 'Hill Street Blues', url: '/audio/sleep/blessing/Hill Street Blues.mp3' },
        { name: 'Greensleeves', url: '/audio/sleep/blessing/Greensleeves.mp3' },
        { name: 'Give a Little Time to Your Love', url: '/audio/sleep/blessing/Give a Little Time to Your Love.mp3' },
        { name: 'Concerto Pour Une Jeune Fille Nommée Je t\' Aime', url: '/audio/sleep/blessing/Concerto Pour Une Jeune Fille Nommée Je t\' Aime.mp3' },
        { name: 'Chariots Of Fire', url: '/audio/sleep/blessing/Chariots Of Fire.mp3' },
        { name: 'Bach Gammon', url: '/audio/sleep/blessing/Bach Gammon.mp3' },
        { name: 'A Comme Amour', url: '/audio/sleep/blessing/A Comme Amour.mp3' },
        { name: 'A Comm Amour', url: '/audio/sleep/blessing/A Comm Amour.mp3' }
      ]
    }
  }

  const currentModeConfig = sleepModes[currentMode]
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // 定时器效果
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false)
            return 0
          }
          return prev - 1
        })
      }, 60000) // 每分钟更新一次
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [isPlaying, timeLeft])

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      setTimeLeft(0)
      if (audioRef.current) {
        audioRef.current.pause()
      }
    } else {
      setIsPlaying(true)
      setTimeLeft(duration)
      
      // 直接播放当前曲目，不播放祝福语
      playCurrentTrack()
    }
  }

  const playCurrentTrack = () => {
    if (currentModeConfig.playlist && currentModeConfig.playlist.length > 0) {
      const track = currentModeConfig.playlist[currentTrack]
      setIsLoading(true)
      
      if (audioRef.current) {
        audioRef.current.src = track.url
        audioRef.current.volume = volume
        audioRef.current.loop = true // 循环播放当前曲目
        
        audioRef.current.addEventListener('loadeddata', () => {
          setIsLoading(false)
          if (isPlaying) {
            audioRef.current.play().catch(error => {
              console.error('音频播放失败:', error)
              // 如果当前音频文件无法播放，尝试下一首
              nextTrack()
            })
          }
        }, { once: true })
        
        audioRef.current.addEventListener('error', () => {
          console.error('音频加载失败:', track.url)
          setIsLoading(false)
          // 尝试下一首
          nextTrack()
        }, { once: true })
        
        audioRef.current.load()
      }
    }
  }

  const nextTrack = () => {
    if (currentModeConfig.playlist && currentModeConfig.playlist.length > 0) {
      const nextIndex = (currentTrack + 1) % currentModeConfig.playlist.length
      setCurrentTrack(nextIndex)
    }
  }

  const prevTrack = () => {
    if (currentModeConfig.playlist && currentModeConfig.playlist.length > 0) {
      const prevIndex = currentTrack === 0 ? currentModeConfig.playlist.length - 1 : currentTrack - 1
      setCurrentTrack(prevIndex)
    }
  }

  const selectTrack = (index) => {
    setCurrentTrack(index)
    if (isPlaying) {
      // 如果正在播放，切换到新曲目
      setTimeout(playCurrentTrack, 100)
    }
  }

  const handleModeChange = (mode) => {
    setCurrentMode(mode)
    setCurrentTrack(0) // 重置到第一首
    if (isPlaying) {
      setIsPlaying(false)
      setTimeLeft(0)
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }

  const formatTime = (minutes) => {
    return `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}`
  }

  // 当曲目改变时，更新播放
  useEffect(() => {
    if (isPlaying) {
      playCurrentTrack()
    }
  }, [currentTrack])

  // 当音量改变时，更新音频音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  return (
    <div className="max-w-4xl mx-auto">
      {/* 主控制面板 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-8 mb-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <Moon className="text-blue-300" size={32} />
            睡前安抚模式
          </h2>
          <p className="text-white/70">温柔的声音陪伴宝宝入睡</p>
        </div>

        {/* 当前播放状态 */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8 p-6 bg-white/10 rounded-2xl"
          >
            <div className="text-6xl mb-4 animate-pulse">🌙</div>
            <h3 className="text-xl text-white font-semibold mb-2">
              正在播放：{currentModeConfig.name}
            </h3>
            <p className="text-white/70 mb-2">{currentModeConfig.description}</p>
            
            {/* 当前曲目信息 */}
            {currentModeConfig.playlist && currentModeConfig.playlist[currentTrack] && (
              <div className="bg-white/10 rounded-lg p-3 mb-4">
                <p className="text-white/90 font-medium">
                  {currentModeConfig.playlist[currentTrack].name}
                </p>
                <p className="text-white/60 text-sm">
                  {currentTrack + 1} / {currentModeConfig.playlist.length}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-4 text-white/80">
              <Clock size={20} />
              <span>剩余时间：{Math.floor(timeLeft)}分钟</span>
            </div>
            
            {/* 音乐控制按钮 */}
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={prevTrack}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                disabled={!currentModeConfig.playlist || currentModeConfig.playlist.length <= 1}
              >
                ⏮️
              </button>
              <button
                onClick={nextTrack}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                disabled={!currentModeConfig.playlist || currentModeConfig.playlist.length <= 1}
              >
                ⏭️
              </button>
            </div>
            
            {isLoading && (
              <p className="text-white/60 text-sm mt-2">🎵 加载音乐中...</p>
            )}
          </motion.div>
        )}

        {/* 模式选择 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(sleepModes).map(([key, mode]) => (
            <motion.button
              key={key}
              onClick={() => handleModeChange(key)}
              className={`p-4 rounded-xl transition-all ${
                currentMode === key
                  ? 'bg-white/20 text-white ring-2 ring-white/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isPlaying}
            >
              <div className="text-3xl mb-2">{mode.icon}</div>
              <div className="text-sm font-medium">{mode.name}</div>
            </motion.button>
          ))}
        </div>

        {/* 控制设置 */}
        <div className="space-y-6">
          {/* 播放时长 */}
          <div className="flex items-center gap-4">
            <label className="text-white/70 text-sm min-w-24">播放时长</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={isPlaying}
              className="bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20 flex-1"
            >
              <option value={15} className="bg-gray-800">15分钟</option>
              <option value={30} className="bg-gray-800">30分钟</option>
              <option value={45} className="bg-gray-800">45分钟</option>
              <option value={60} className="bg-gray-800">1小时</option>
            </select>
          </div>

          {/* 音量控制 */}
          <div className="flex items-center gap-4">
            <label className="text-white/70 text-sm min-w-24">音量</label>
            <Volume2 size={16} className="text-white/70" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-white/70 text-sm min-w-12">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* 播放控制 */}
          <div className="flex justify-center">
            <motion.button
              onClick={handlePlay}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center gap-3 ${
                isPlaying
                  ? 'bg-red-500/80 hover:bg-red-500 text-white'
                  : 'bg-blue-500/80 hover:bg-blue-500 text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              {isPlaying ? '停止播放' : '开始播放'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 播放列表 */}
      {currentModeConfig.playlist && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-6 mb-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            🎵 {currentModeConfig.name} 播放列表
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {currentModeConfig.playlist.map((track, index) => (
              <button
                key={index}
                onClick={() => selectTrack(index)}
                className={`p-3 rounded-lg text-left transition-all ${
                  currentTrack === index
                    ? 'bg-purple-500/30 text-white border border-purple-500/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {currentTrack === index && isPlaying ? '🎵' : '🎶'}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{track.name}</p>
                    <p className="text-xs opacity-70">曲目 {index + 1}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 text-center text-white/60 text-sm">
            点击任意曲目即可切换播放
          </div>
        </motion.div>
      )}

      {/* 使用说明 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-white/60 text-sm space-y-2"
      >
        <p>🎵 四种音乐模式：摇篮曲(20首)、心跳白噪音(6首)、宫崎骏动画音乐(28首)、睡前音乐(41首)</p>
        <p>🔄 总计95首精选音乐，循环播放，随时切换</p>
        <p>💤 建议在睡前30分钟开始播放，帮助宝宝放松入睡</p>
      </motion.div>

      {/* 隐藏的音频元素 */}
      <audio ref={audioRef} loop />
    </div>
  )
}

export default SleepModePlayer 