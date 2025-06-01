import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { Play, Pause, Upload, Volume2, Clock, Trash2, Music } from 'lucide-react'

// 3D红心组件
function HeartbeatSphere({ audioData, isPlaying }) {
  const meshRef = useRef()
  const [scale, setScale] = useState(1)

  // 创建心形轮廓
  const createHeartShape = () => {
    const heartShape = new THREE.Shape()
    
    // 使用经典心形数学公式创建更优美的心形
    const scale = 0.5
    heartShape.moveTo(0, -4 * scale)
    
    // 左半边心形
    heartShape.bezierCurveTo(-4 * scale, -8 * scale, -8 * scale, -4 * scale, -8 * scale, 0)
    heartShape.bezierCurveTo(-8 * scale, 4 * scale, -4 * scale, 6 * scale, 0, 8 * scale)
    
    // 右半边心形
    heartShape.bezierCurveTo(4 * scale, 6 * scale, 8 * scale, 4 * scale, 8 * scale, 0)
    heartShape.bezierCurveTo(8 * scale, -4 * scale, 4 * scale, -8 * scale, 0, -4 * scale)
    
    return heartShape
  }

  // 创建3D心形几何体
  const createHeartGeometry = () => {
    const heartShape = createHeartShape()
    
    const extrudeSettings = {
      depth: 1.5,
      bevelEnabled: true,
      bevelSegments: 25,
      steps: 3,
      bevelSize: 0.2,
      bevelThickness: 0.2,
      curveSegments: 60
    }
    
    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings)
    
    // 居中几何体
    geometry.computeBoundingBox()
    const boundingBox = geometry.boundingBox
    const centerX = (boundingBox.max.x + boundingBox.min.x) / 2
    const centerY = (boundingBox.max.y + boundingBox.min.y) / 2
    const centerZ = (boundingBox.max.z + boundingBox.min.z) / 2
    
    geometry.translate(-centerX, -centerY, -centerZ)
    
    return geometry
  }

  useFrame((state) => {
    if (meshRef.current) {
      // 基础心跳动画 - 150 BPM (2.5Hz)
      const baseScale = 1 + Math.sin(state.clock.elapsedTime * 2.5 * 2 * Math.PI) * 0.15
      
      // 心跳数据驱动的缩放
      const heartbeatScale = audioData ? 1 + (audioData.volume || 0) * 0.4 : 1
      
      const finalScale = baseScale * heartbeatScale
      meshRef.current.scale.setScalar(finalScale * 0.25) // 缩放以适合场景
      
      // 轻微旋转动画
      meshRef.current.rotation.y += 0.005
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      
      // 发光效果变化 - 与心跳同步
      const glowIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2.5 * 2 * Math.PI) * 0.2
      if (meshRef.current.material) {
        meshRef.current.material.emissiveIntensity = glowIntensity
      }
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI]}>
      <primitive object={createHeartGeometry()} />
      <meshStandardMaterial 
        color="#d32f2f"
        emissive="#ff1744"
        emissiveIntensity={0.3}
        metalness={0.1}
        roughness={0.3}
        transparent={true}
        opacity={0.9}
      />
    </mesh>
  )
}

// 粒子星空组件
function ParticleField({ audioData }) {
  const pointsRef = useRef()
  const particleCount = 1000

  useEffect(() => {
    if (pointsRef.current) {
      const positions = new Float32Array(particleCount * 3)
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20
      }
      
      pointsRef.current.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      )
    }
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0005
      pointsRef.current.rotation.x += 0.0002
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial color="#ffffff" size={0.05} transparent opacity={0.8} />
    </points>
  )
}

// 音频波形环组件
function AudioRing({ audioData }) {
  const ringRef = useRef()

  useFrame((state) => {
    if (ringRef.current && audioData?.frequencies) {
      const time = state.clock.elapsedTime
      // 与心跳同步的缩放动画 - 150 BPM
      const scale = 2 + Math.sin(time * 2.5 * 2 * Math.PI) * 0.5
      ringRef.current.scale.setScalar(scale)
      ringRef.current.rotation.z += 0.02
    }
  })

  return (
    <mesh ref={ringRef} position={[0, 0, 0]}>
      <torusGeometry args={[3, 0.1, 16, 100]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
    </mesh>
  )
}

// 光圈波纹组件
function RippleEffect({ isPlaying }) {
  const rippleRef = useRef()
  const [ripples, setRipples] = useState([])

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setRipples(prev => [
          ...prev.slice(-5), // 只保留最新的5个波纹
          {
            id: Date.now(),
            scale: 0,
            opacity: 1
          }
        ])
      }, 400) // 400ms间隔，对应150 BPM心跳频率

      return () => clearInterval(interval)
    }
  }, [isPlaying])

  useFrame(() => {
    setRipples(prev => 
      prev.map(ripple => ({
        ...ripple,
        scale: ripple.scale + 0.05,
        opacity: Math.max(0, ripple.opacity - 0.02)
      })).filter(ripple => ripple.opacity > 0)
    )
  })

  return (
    <group>
      {ripples.map(ripple => (
        <mesh key={ripple.id} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ripple.scale, ripple.scale + 0.1, 32]} />
          <meshBasicMaterial 
            color="#ff69b4" 
            transparent 
            opacity={ripple.opacity * 0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

// 主场景组件
function Scene({ audioData, isPlaying }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff69b4" />
      
      <HeartbeatSphere audioData={audioData} isPlaying={isPlaying} />
      <ParticleField audioData={audioData} />
      <AudioRing audioData={audioData} />
      <RippleEffect isPlaying={isPlaying} />
      
      <Text
        position={[0, -4, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        宝宝的心跳宇宙 💕
      </Text>
      
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        maxDistance={15}
        minDistance={3}
      />
    </>
  )
}

// 主组件
function HeartbeatScene({ heartbeatData, setHeartbeatData }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioFile, setAudioFile] = useState(null)
  const [audioContext, setAudioContext] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const [audioElement, setAudioElement] = useState(null)
  const [audioData, setAudioData] = useState({ volume: 0, frequencies: null })
  const [volume, setVolume] = useState(0.7)
  const [mediaSource, setMediaSource] = useState(null)
  const [gainNode, setGainNode] = useState(null)
  const [recordingHistory, setRecordingHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [currentRecording, setCurrentRecording] = useState(null)

  // 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('babyBeats_heartbeat_history')
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory)
        setRecordingHistory(history)
      } catch (error) {
        console.error('加载历史记录失败:', error)
      }
    }
  }, [])

  // 保存历史记录
  const saveToHistory = (file, audioUrl) => {
    const recording = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      duration: 0, // 可以通过audio元素获取时长
      uploadTime: new Date().toISOString(),
      audioUrl: audioUrl,
      type: file.type
    }

    const newHistory = [recording, ...recordingHistory.slice(0, 9)] // 保留最近10个
    setRecordingHistory(newHistory)
    localStorage.setItem('babyBeats_heartbeat_history', JSON.stringify(newHistory))
    
    return recording
  }

  // 删除历史记录
  const deleteFromHistory = (id) => {
    const updatedHistory = recordingHistory.filter(item => item.id !== id)
    setRecordingHistory(updatedHistory)
    localStorage.setItem('babyBeats_heartbeat_history', JSON.stringify(updatedHistory))
    
    // 如果删除的是当前正在播放的录音，停止播放
    if (currentRecording?.id === id) {
      if (audioElement) {
        audioElement.pause()
        setIsPlaying(false)
      }
      setCurrentRecording(null)
      setAudioFile(null)
      setAudioElement(null)
    }
  }

  // 选择历史录音播放
  const selectHistoryRecording = async (recording) => {
    try {
      // 停止当前播放
      if (audioElement) {
        audioElement.pause()
        setIsPlaying(false)
      }
      if (mediaSource) {
        mediaSource.disconnect()
        setMediaSource(null)
      }
      if (gainNode) {
        setGainNode(null)
      }

      // 从localStorage获取保存的音频数据
      const audioData = localStorage.getItem(`audio_${recording.id}`)
      if (audioData) {
        // 创建新的音频元素
        const audio = new Audio(audioData)
        audio.loop = true
        audio.volume = volume
        setAudioElement(audio)
        setCurrentRecording(recording)
        setAudioFile({ name: recording.name }) // 为了显示文件名
        
        // 更新全局状态
        setHeartbeatData({
          file: { name: recording.name },
          audio: audio,
          uploadTime: recording.uploadTime,
          id: recording.id
        })
      } else {
        alert('录音文件已丢失，请重新上传')
        deleteFromHistory(recording.id)
      }
    } catch (error) {
      console.error('播放历史录音失败:', error)
      alert('播放失败，请重新上传录音')
    }
  }

  useEffect(() => {
    // 创建音频上下文
    const context = new (window.AudioContext || window.webkitAudioContext)()
    const analyserNode = context.createAnalyser()
    analyserNode.fftSize = 256
    
    setAudioContext(context)
    setAnalyser(analyserNode)

    return () => {
      // 清理所有音频资源
      if (mediaSource) {
        mediaSource.disconnect()
      }
      context.close()
    }
  }, [])

  useEffect(() => {
    if (audioElement && audioContext && analyser && !mediaSource) {
      try {
        // 只有在没有现有连接时才创建新的 MediaElementSource
      const source = audioContext.createMediaElementSource(audioElement)
        const gain = audioContext.createGain()
      
        source.connect(gain)
        gain.connect(analyser)
      analyser.connect(audioContext.destination)
      
        gain.gain.value = volume
        setMediaSource(source)
        setGainNode(gain)

        // 清理函数
        return () => {
          if (source) {
            source.disconnect()
          }
          setMediaSource(null)
          setGainNode(null)
        }
      } catch (error) {
        console.error('音频连接失败:', error)
      }
    }
  }, [audioElement, audioContext, analyser])

  // 更新音量
  useEffect(() => {
    if (gainNode) {
      gainNode.gain.value = volume
    }
    if (audioElement) {
      audioElement.volume = volume
    }
  }, [volume, gainNode, audioElement])

  // 处理音频分析
  useEffect(() => {
    if (mediaSource && isPlaying && analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const updateAudioData = () => {
        analyser.getByteFrequencyData(dataArray)
        
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
        setAudioData({
          volume: average / 255,
          frequencies: dataArray
        })
        
        if (isPlaying) {
          requestAnimationFrame(updateAudioData)
        }
      }
      
        updateAudioData()
    }
  }, [isPlaying, mediaSource, analyser])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // 清理之前的音频元素和连接
      if (audioElement) {
        audioElement.pause()
        setIsPlaying(false)
      }
      if (mediaSource) {
        mediaSource.disconnect()
        setMediaSource(null)
      }
      if (gainNode) {
        setGainNode(null)
      }

      const audioUrl = URL.createObjectURL(file)
      
      // 保存到历史记录
      const recording = saveToHistory(file, audioUrl)
      
      // 将音频文件转换为base64保存到localStorage
      const reader = new FileReader()
      reader.onload = (e) => {
        localStorage.setItem(`audio_${recording.id}`, e.target.result)
      }
      reader.readAsDataURL(file)

      setAudioFile(file)
      setCurrentRecording(recording)
      const audio = new Audio(audioUrl)
      audio.loop = true
      audio.volume = volume
      
      // 获取音频时长
      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && audio.duration !== Infinity) {
          recording.duration = audio.duration
          const updatedHistory = recordingHistory.map(item => 
            item.id === recording.id ? recording : item
          )
          setRecordingHistory(updatedHistory)
          localStorage.setItem('babyBeats_heartbeat_history', JSON.stringify(updatedHistory))
        }
      })
      
      setAudioElement(audio)
      
      // 保存到全局状态
      setHeartbeatData({
        file: file,
        audio: audio,
        uploadTime: recording.uploadTime,
        id: recording.id
      })
    }
  }

  const togglePlayPause = async () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        try {
          await audioContext.resume()
          await audioElement.play()
          setIsPlaying(true)
        } catch (error) {
          console.error('播放失败:', error)
        }
      }
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioElement) {
      audioElement.volume = newVolume
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化时长
  const formatDuration = (seconds) => {
    if (!seconds || seconds === Infinity) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 格式化时间
  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('zh-CN') + ' ' + 
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="w-full h-screen relative">
      {/* 3D 场景 */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          style={{ background: 'radial-gradient(circle, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
        >
          <Scene audioData={audioData} isPlaying={isPlaying} />
        </Canvas>
      </div>

      {/* 控制面板 */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
        <motion.div 
          className="glass-effect rounded-xl p-4 min-w-80 max-w-4xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="text-center mb-3">
            <h3 className="text-lg font-bold text-white mb-1">胎心播放器</h3>
            <p className="text-xs text-white/70">感受生命的律动</p>
          </div>

          <div className="flex flex-col gap-3">
            {/* 文件上传和历史记录按钮 */}
            <div className="flex gap-2">
            {!audioFile && (
                <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                  <div className="flex items-center justify-center gap-2 bg-heart-red/20 hover:bg-heart-red/30 text-white rounded-lg p-2 transition-all text-sm">
                    <Upload size={16} />
                    上传录音
                </div>
              </label>
            )}
              
              {recordingHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-white rounded-lg p-2 transition-all text-sm whitespace-nowrap"
                >
                  <Clock size={16} />
                  历史 ({recordingHistory.length})
                </button>
              )}
            </div>

            {/* 历史记录列表 */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/5 rounded-lg p-3 max-h-48 overflow-y-auto"
                >
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2 text-sm">
                    <Music size={14} />
                    录音历史
                  </h4>
                  <div className="space-y-1">
                    {recordingHistory.map((recording) => (
                      <motion.div
                        key={recording.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-2 rounded-lg cursor-pointer transition-all text-xs ${
                          currentRecording?.id === recording.id
                            ? 'bg-heart-red/20 border border-heart-red/50'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => selectHistoryRecording(recording)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">
                              {recording.name}
                            </p>
                            <p className="text-white/50 text-xs">
                              {formatTime(recording.uploadTime)} • {formatFileSize(recording.size)} • {formatDuration(recording.duration)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteFromHistory(recording.id)
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors ml-2"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 播放控制 */}
            {audioFile && (
              <>
                {/* 当前播放信息 - 紧凑布局 */}
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Music size={14} className="text-heart-red flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-xs font-medium truncate">{audioFile.name}</p>
                        {currentRecording && (
                          <p className="text-white/60 text-xs">
                            {formatTime(currentRecording.uploadTime)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-white/80 text-xs flex items-center gap-1">
                      心跳: {Math.round(audioData.volume * 100)}%
                      {isPlaying && <span className="animate-pulse">💗</span>}
                    </div>
                  </div>
                </div>

                {/* 控制按钮 - 水平布局 */}
                <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayPause}
                    className="flex items-center gap-1 bg-heart-red/20 hover:bg-heart-red/30 text-white rounded-lg px-3 py-2 transition-all text-sm"
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {isPlaying ? '暂停' : '播放'}
                </button>

                  <label className="cursor-pointer flex-1">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-1 bg-blue-500/20 hover:bg-blue-500/30 text-white rounded-lg p-2 transition-all text-xs">
                      <Upload size={14} />
                      新录音
                    </div>
                  </label>

                  <div className="flex items-center gap-1 flex-1">
                    <Volume2 size={14} className="text-white" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1"
                  />
                </div>
              </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* 说明文字 */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div 
          className="glass-effect rounded-lg p-3 max-w-56"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5 }}
        >
          <h4 className="text-white font-medium mb-1 text-sm">🌌 心跳宇宙</h4>
          <p className="text-xs text-white/70">
            心跳驱动光圈波纹，拖拽旋转视角
          </p>
          {recordingHistory.length > 0 && (
            <p className="text-xs text-white/60 mt-1">
              💾 {recordingHistory.length} 个录音
          </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default HeartbeatScene 