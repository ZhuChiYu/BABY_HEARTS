import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Mic, MicOff, Image, Send, Trash2, Volume2, Download } from 'lucide-react'

function MessageWall() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState({
    text: '',
    type: 'text',
    author: '爸爸',
    mood: '😊'
  })
  const [isRecording, setIsRecording] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const fileInputRef = useRef(null)

  // 从本地存储加载留言
  useEffect(() => {
    const stored = localStorage.getItem('babyBeats_messages')
    if (stored) {
      setMessages(JSON.parse(stored))
    }
  }, [])

  // 保存留言到本地存储
  const saveMessages = (newMessages) => {
    localStorage.setItem('babyBeats_messages', JSON.stringify(newMessages))
    setMessages(newMessages)
  }

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setNewMessage(prev => ({ 
          ...prev, 
          type: 'audio', 
          audioUrl,
          audioBlob
        }))
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('录音失败:', error)
      alert('无法访问麦克风，请检查权限设置')
    }
  }

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  // 处理图片上传
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target.result)
        setNewMessage(prev => ({ 
          ...prev, 
          type: 'image', 
          imageUrl: e.target.result,
          imageFile: file
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // 添加留言
  const addMessage = () => {
    if (newMessage.type === 'text' && !newMessage.text.trim()) {
      alert('请输入留言内容')
      return
    }

    if (newMessage.type === 'audio' && !newMessage.audioUrl) {
      alert('请先录制语音')
      return
    }

    if (newMessage.type === 'image' && !newMessage.imageUrl) {
      alert('请先选择图片')
      return
    }

    const message = {
      id: Date.now(),
      ...newMessage,
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleString('zh-CN')
    }

    const updatedMessages = [message, ...messages]
    saveMessages(updatedMessages)

    // 重置表单
    setNewMessage({
      text: '',
      type: 'text',
      author: newMessage.author,
      mood: '😊'
    })
    setSelectedImage(null)
    setShowAddForm(false)

    // 清理文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 删除留言
  const deleteMessage = (id) => {
    const updatedMessages = messages.filter(msg => msg.id !== id)
    saveMessages(updatedMessages)
  }

  // 播放语音
  const playAudio = (audioUrl) => {
    const audio = new Audio(audioUrl)
    audio.play()
  }

  // 导出留言为文本
  const exportMessages = () => {
    const content = messages
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(msg => {
        const date = new Date(msg.timestamp).toLocaleDateString('zh-CN')
        const author = msg.author
        const mood = msg.mood
        
        if (msg.type === 'text') {
          return `${date} - ${author} ${mood}\n${msg.text}\n`
        } else if (msg.type === 'audio') {
          return `${date} - ${author} ${mood}\n[语音留言]\n`
        } else if (msg.type === 'image') {
          return `${date} - ${author} ${mood}\n[图片留言]${msg.text ? `: ${msg.text}` : ''}\n`
        }
        return ''
      })
      .join('\n---\n\n')

    const blob = new Blob([`Baby Beats 家庭留言墙\n\n${content}`], 
                         { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `家庭留言墙_${new Date().toLocaleDateString('zh-CN')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const moods = ['😊', '🥰', '😍', '🤗', '😢', '😴', '😋', '🥺', '😎', '🤔']
  const authors = ['爸爸', '妈妈', '爷爷', '奶奶', '外公', '外婆', '其他']

  const getMessageIcon = (type) => {
    switch (type) {
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      default: return '💬'
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 标题和控制栏 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <MessageSquare className="text-blue-300" size={28} />
              家庭留言墙
            </h2>
            <p className="text-white/70">给宝宝留下温暖的话语和美好的回忆</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-heart-red/80 hover:bg-heart-red text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Send size={18} />
              新留言
            </button>
            
            <button
              onClick={exportMessages}
              className="bg-blue-500/80 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              导出
            </button>
          </div>
        </div>
      </motion.div>

      {/* 添加留言表单 */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-effect rounded-2xl p-6 mb-6"
          >
            <h3 className="text-white font-semibold mb-4">✨ 写下新留言</h3>
            
            <div className="space-y-4">
              {/* 留言类型选择 */}
              <div>
                <label className="block text-white/70 text-sm mb-2">留言类型</label>
                <div className="flex gap-2">
                  {[
                    { value: 'text', label: '💬 文字', icon: MessageSquare },
                    { value: 'audio', label: '🎵 语音', icon: Mic },
                    { value: 'image', label: '🖼️ 图片', icon: Image }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewMessage(prev => ({ ...prev, type: type.value }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        newMessage.type === type.value
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 作者和心情 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">留言人</label>
                  <select
                    value={newMessage.author}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20"
                  >
                    {authors.map(author => (
                      <option key={author} value={author} className="bg-gray-800">
                        {author}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm mb-2">心情</label>
                  <div className="flex gap-1 flex-wrap">
                    {moods.map(mood => (
                      <button
                        key={mood}
                        onClick={() => setNewMessage(prev => ({ ...prev, mood }))}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          newMessage.mood === mood
                            ? 'bg-white/20 scale-110'
                            : 'bg-white/10 hover:bg-white/15'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 内容输入 */}
              {newMessage.type === 'text' && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">留言内容</label>
                  <textarea
                    value={newMessage.text}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="写下想对宝宝说的话..."
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 border border-white/20 focus:border-white/40 focus:outline-none"
                    rows={4}
                  />
                </div>
              )}

              {/* 语音录制 */}
              {newMessage.type === 'audio' && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">语音留言</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                        isRecording
                          ? 'bg-red-500/80 text-white animate-pulse'
                          : 'bg-blue-500/80 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                      {isRecording ? '停止录音' : '开始录音'}
                    </button>
                    
                    {newMessage.audioUrl && (
                      <button
                        onClick={() => playAudio(newMessage.audioUrl)}
                        className="bg-green-500/80 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Volume2 size={16} />
                        试听
                      </button>
                    )}
                  </div>
                  
                  {isRecording && (
                    <p className="text-red-300 text-sm mt-2 animate-pulse">
                      🎤 正在录音...点击停止录音完成
                    </p>
                  )}
                </div>
              )}

              {/* 图片上传 */}
              {newMessage.type === 'image' && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">选择图片</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-500/80 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mb-3"
                  >
                    <Image size={18} />
                    选择图片
                  </button>
                  
                  {selectedImage && (
                    <div className="mb-3">
                      <img 
                        src={selectedImage} 
                        alt="预览" 
                        className="max-w-xs rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                  
                  <textarea
                    value={newMessage.text}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="为图片添加说明（可选）..."
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-2 border border-white/20 focus:border-white/40 focus:outline-none"
                    rows={2}
                  />
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={addMessage}
                  className="bg-heart-red/80 hover:bg-heart-red text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send size={18} />
                  发布留言
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 留言列表 */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-effect rounded-2xl p-8 text-center"
          >
            <MessageSquare className="mx-auto text-blue-300 mb-4" size={48} />
            <h3 className="text-white font-semibold mb-2">还没有留言</h3>
            <p className="text-white/70">开始为宝宝留下第一个温暖的留言吧！</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{message.mood}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getMessageIcon(message.type)}</span>
                        <span className="text-white font-medium">{message.author}</span>
                      </div>
                      <p className="text-white/60 text-sm">{message.formattedTime}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="text-white/50 hover:text-red-300 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* 留言内容 */}
                <div className="ml-14">
                  {message.type === 'text' && (
                    <p className="text-white/80 leading-relaxed">{message.text}</p>
                  )}
                  
                  {message.type === 'audio' && (
                    <button
                      onClick={() => playAudio(message.audioUrl)}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Volume2 size={16} />
                      播放语音留言
                    </button>
                  )}
                  
                  {message.type === 'image' && (
                    <div>
                      <img 
                        src={message.imageUrl} 
                        alt="留言图片" 
                        className="max-w-md rounded-lg shadow-lg mb-2"
                      />
                      {message.text && (
                        <p className="text-white/80">{message.text}</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 统计信息 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center text-white/60 text-sm"
      >
        💕 已收集了 {messages.length} 条温暖的留言
      </motion.div>
    </div>
  )
}

export default MessageWall 