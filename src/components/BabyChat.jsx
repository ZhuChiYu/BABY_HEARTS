import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff, Volume2, VolumeX, Baby } from 'lucide-react'

// 计算孕周的函数
const calculatePregnancyWeek = (lastMenstrualDate) => {
  const lmp = new Date(lastMenstrualDate)
  const today = new Date()
  const diffTime = today - lmp
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  const weeks = Math.floor(diffDays / 7)
  const days = diffDays % 7
  
  return { weeks, days, totalDays: diffDays }
}

// AI 服务 - 使用本地Ollama
const getAIResponse = async (message, pregnancyInfo) => {
  try {
    const prompt = `你是一个${pregnancyInfo.weeks}周${pregnancyInfo.days}天大的胎儿宝宝，在妈妈肚子里。请用可爱、温暖、充满爱意的语气回复爸爸妈妈的话。

特点：
- 你现在${pregnancyInfo.weeks}周${pregnancyInfo.days}天大
- 你能听到外面的声音，感受到妈妈的情绪
- 你正在快速成长，各个器官在发育
- 你很爱爸爸妈妈，期待与他们见面
- 回复要简短温馨，带有可爱的语气词和表情符号
- 偶尔提到你现在的发育情况

爸爸妈妈对你说："${message}"

请回复：`

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:70b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.8,
          max_tokens: 500  // 增加token限制，确保完整回复
        }
      })
    })

    if (!response.ok) {
      throw new Error('Ollama服务连接失败')
    }

    const result = await response.json()
    
    // 过滤DeepSeek R1的<think>标签内容
    let filteredResponse = result.response
    if (filteredResponse) {
      // 使用正则表达式移除<think>...</think>标签及其内容
      filteredResponse = filteredResponse.replace(/<think>[\s\S]*?<\/think>/gi, '')
      // 移除可能残留的单独的<think>或</think>标签
      filteredResponse = filteredResponse.replace(/<\/?think>/gi, '')
      // 清理多余的空白字符
      filteredResponse = filteredResponse.trim()
      // 如果过滤后内容为空，使用降级回复
      if (!filteredResponse) {
        throw new Error('AI回复内容被完全过滤')
      }
    }
    
    return filteredResponse

  } catch (error) {
    console.error('AI回复失败:', error)
    // 降级到预设回复
    const fallbackResponses = [
      `爸爸妈妈，我在妈妈肚子里听到你们说话啦！我现在${pregnancyInfo.weeks}周${pregnancyInfo.days}天大啦~ 💕`,
      `妈妈，我感受到你温柔的抚摸，好舒服呀！我在慢慢长大，等着和你们见面呢！👶`,
      `爸爸的声音好温暖，我最喜欢听你们给我讲故事啦！我会乖乖听话的~`,
      `我现在会踢腿腿啦！妈妈感受到了吗？这是我在和你们打招呼呢！`,
      `谢谢爸爸妈妈的关心，我在这里很安全很温暖，正在努力长大呢！`,
      `我最喜欢听音乐啦，心跳声就是我最爱的摇篮曲！🎵`
    ]
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
  }
}

// 语音转文字功能
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognition = useRef(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = false
      recognition.current.interimResults = false
      recognition.current.lang = 'zh-CN'

      recognition.current.onresult = (event) => {
        const text = event.results[0][0].transcript
        setTranscript(text)
      }

      recognition.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const startListening = () => {
    if (recognition.current) {
      setIsListening(true)
      recognition.current.start()
    }
  }

  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop()
      setIsListening(false)
    }
  }

  return { isListening, transcript, startListening, stopListening, setTranscript }
}

// 语音播放功能
const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState(null)

  // 初始化最适合的儿童声音
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        // 优先选择女性、中文或儿童声音
        let bestVoice = voices.find(voice => 
          voice.lang.includes('zh') && 
          (voice.name.includes('女') || voice.name.includes('Female') || voice.name.includes('Xiaoxiao'))
        ) || voices.find(voice => 
          voice.lang.includes('zh')
        ) || voices.find(voice => 
          voice.name.includes('Female') || voice.name.includes('女')
        ) || voices[0]
        
        setSelectedVoice(bestVoice)
        console.log('选择的语音:', bestVoice?.name)
      }
    }

    // 语音加载可能是异步的，需要监听事件
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices()
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      // 停止当前播放
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      
      // 设置语音参数，模拟儿童声音
      utterance.lang = 'zh-CN'
      utterance.rate = 0.9          // 稍快的语速，像小孩子说话
      utterance.pitch = 1.6         // 高音调，更像小孩子
      utterance.volume = 0.9        // 音量
      
      // 使用选中的最佳语音
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    }
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const changeVoice = (voice) => {
    setSelectedVoice(voice)
    console.log('切换语音到:', voice?.name)
  }

  return { speak, stop, isSpeaking, selectedVoice, changeVoice }
}

function BabyChat() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastMenstrualDate, setLastMenstrualDate] = useState('2025-01-15') // 末次月经日期
  const [availableVoices, setAvailableVoices] = useState([]) // 可用语音列表
  const messagesEndRef = useRef(null) // 添加用于滚动的引用
  
  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition()
  const { speak, stop, isSpeaking, selectedVoice, changeVoice } = useSpeechSynthesis()

  // 计算当前孕周
  const pregnancyInfo = calculatePregnancyWeek(lastMenstrualDate)

  // 加载可用语音
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      // 过滤出中文或女性语音
      const suitableVoices = voices.filter(voice => 
        voice.lang.includes('zh') || 
        voice.name.includes('Female') || 
        voice.name.includes('女') ||
        voice.name.includes('Xiaoxiao') ||
        voice.name.includes('Xiaoyi')
      )
      setAvailableVoices(suitableVoices.length > 0 ? suitableVoices : voices.slice(0, 5))
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices()
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 当消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 初始化时添加欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: 1,
        type: 'baby',
        content: `爸爸妈妈好！我是你们的宝宝~现在${pregnancyInfo.weeks}周${pregnancyInfo.days}天啦！想和你们聊天呢！💕`,
        timestamp: new Date().toISOString()
      }
      setMessages([welcomeMessage])
    }
  }, [pregnancyInfo.weeks, pregnancyInfo.days])

  // 监听语音识别结果
  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript)
      setTranscript('')
    }
  }, [transcript])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await getAIResponse(currentMessage, pregnancyInfo)
      
      // 确保response不为空且已正确过滤
      if (!response || response.trim().length === 0) {
        throw new Error('AI回复为空')
      }
      
      const babyMessage = {
        id: Date.now() + 1,
        type: 'baby',
        content: response,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, babyMessage])
      
      // 自动播放宝宝回复
      setTimeout(() => {
        speak(response)
      }, 500)

      // 保存到成长日记
      const diaryEntry = {
        date: new Date().toISOString(),
        type: 'chat',
        question: currentMessage,
        answer: response,
        pregnancyWeek: `${pregnancyInfo.weeks}周${pregnancyInfo.days}天`
      }
      
      const existingDiary = JSON.parse(localStorage.getItem('babyBeats_diary') || '[]')
      localStorage.setItem('babyBeats_diary', JSON.stringify([...existingDiary, diaryEntry]))

    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 显示错误消息给用户
      const errorMessage = {
        id: Date.now() + 1,
        type: 'baby',
        content: '哎呀，宝宝暂时听不清楚呢，请稍后再试试~',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-6 h-[80vh] min-h-[600px] max-h-[800px] flex flex-col"
      >
        {/* 标题 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Baby className="text-pink-300" size={28} />
            AI宝宝对话
          </h2>
          <p className="text-white/70 mb-3">和{pregnancyInfo.weeks}周{pregnancyInfo.days}天的小宝宝聊天，听听TA想说什么~</p>
          
          {/* 孕周配置 */}
          <div className="bg-white/10 rounded-lg p-3 text-sm">
            <div className="flex items-center justify-center gap-4 mb-2">
              <span className="text-white/80">末次月经:</span>
              <input
                type="date"
                value={lastMenstrualDate}
                onChange={(e) => setLastMenstrualDate(e.target.value)}
                className="bg-white/20 text-white rounded px-2 py-1 text-xs border border-white/30"
              />
            </div>
            <div className="text-pink-200 mb-2">
              宝宝现在: {pregnancyInfo.weeks}周{pregnancyInfo.days}天 ({pregnancyInfo.totalDays}天)
            </div>
            
            {/* 语音选择器 */}
            {availableVoices.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="text-white/80">宝宝声音:</span>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = availableVoices.find(v => v.name === e.target.value)
                    if (voice) changeVoice(voice)
                  }}
                  className="bg-white/20 text-white rounded px-2 py-1 text-xs border border-white/30 flex-1 max-w-40"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name} className="bg-purple-800">
                      {voice.name.replace(/Microsoft|Google|Apple/gi, '').trim()}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => speak('爸爸妈妈好！我是你们的小宝宝~')}
                  disabled={isSpeaking}
                  className="bg-pink-500/70 hover:bg-pink-500 text-white px-2 py-1 rounded text-xs transition-colors disabled:opacity-50"
                >
                  {isSpeaking ? '🔊' : '试听'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] lg:max-w-[70%] px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-500/80 text-white'
                      : 'bg-pink-400/80 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {message.type === 'baby' && (
                      <button
                        onClick={() => speak(message.content)}
                        className="text-white/70 hover:text-white transition-colors"
                        disabled={isSpeaking}
                      >
                        {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 加载指示器 */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-pink-400/80 text-white px-4 py-3 rounded-2xl max-w-xs">
                <div className="flex items-center gap-2">
                  <div className="animate-bounce">💭</div>
                  <span className="text-sm">宝宝正在思考...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="和宝宝说点什么吧..."
              className="w-full bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-3 pr-12 resize-none border border-white/20 focus:border-white/40 focus:outline-none"
              rows={2}
              disabled={isLoading}
            />
            
            {/* 语音按钮 */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`absolute right-3 top-3 p-1 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-500/80 text-white' 
                  : 'bg-white/20 text-white/70 hover:text-white'
              }`}
              disabled={isLoading}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          {/* 发送按钮 */}
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-heart-red/80 hover:bg-heart-red text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
            发送
          </button>
        </div>

        {/* 语音提示 */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-2"
          >
            <span className="text-red-300 text-sm animate-pulse">
              🎤 正在监听...请说话
            </span>
          </motion.div>
        )}

        {/* 停止语音播放按钮 */}
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-2"
          >
            <button
              onClick={stop}
              className="text-pink-300 text-sm hover:text-pink-200 transition-colors"
            >
              🔊 点击停止播放
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* 使用提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center text-white/60 text-sm"
      >
        💡 点击麦克风可以语音输入，宝宝的回复会自动播放语音
      </motion.div>
    </div>
  )
}

export default BabyChat 