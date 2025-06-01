import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Heart, MessageCircle, Plus, Trash2, Download, Baby, User, Activity, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// 过滤AI思考内容的函数
const filterThinkingContent = (content) => {
  if (!content) return content
  
  // 移除各种格式的思考内容
  let filtered = content
    // 标准的思考标签
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    // markdown格式的思考
    .replace(/\*\*思考\*\*[\s\S]*?\*\*\/思考\*\*/gi, '')
    .replace(/\*\*Thinking\*\*[\s\S]*?\*\*\/Thinking\*\*/gi, '')
    // 中文括号格式
    .replace(/【思考】[\s\S]*?【\/思考】/gi, '')
    .replace(/【Thinking】[\s\S]*?【\/Thinking】/gi, '')
    // 方括号格式
    .replace(/\[思考\][\s\S]*?\[\/思考\]/gi, '')
    .replace(/\[Thinking\][\s\S]*?\[\/Thinking\]/gi, '')
    // 冒号开始的思考内容
    .replace(/思考：[\s\S]*?(?=\n\n|\n[^思]|$)/gi, '')
    .replace(/Thinking:[\s\S]*?(?=\n\n|\n[^T]|$)/gi, '')
    // 其他可能的格式
    .replace(/^\s*思考[\s\S]*?(?=\n\n|\n[^思]|$)/gmi, '')
    .replace(/^思考过程：[\s\S]*?(?=\n\n|\n[^思]|$)/gmi, '')
    .trim()
    
  // 移除多余的空行
  filtered = filtered.replace(/\n\s*\n\s*\n/g, '\n\n')
  
  // 移除开头和结尾的空白字符
  filtered = filtered.trim()
    
  return filtered
}

// 计算孕周的函数
const calculatePregnancyWeek = (lastMenstrualDate) => {
  const lmp = new Date(lastMenstrualDate)
  const today = new Date()
  const diffTime = today - lmp
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  const weeks = Math.floor(diffDays / 7)
  const days = diffDays % 7
  
  // 计算预产期（280天）
  const dueDate = new Date(lmp)
  dueDate.setDate(dueDate.getDate() + 280)
  const daysToDue = Math.max(0, Math.floor((dueDate - today) / (1000 * 60 * 60 * 24)))
  
  return { weeks, days, totalDays: diffDays, daysToDue, dueDate }
}

// 使用AI生成孕期信息
const generatePregnancyInfo = async (pregnancyInfo) => {
  try {
    const prompt = `请作为专业的产科医生，为${pregnancyInfo.weeks}周${pregnancyInfo.days}天的孕期提供详细的发育信息。

请按以下格式提供信息：

## 宝宝发育数据
- 身长：xx-xx mm
- 体重：xx-xx g
- 胎儿大小比喻：（如苹果大小、香蕉大小等）

## 宝宝本周变化
（描述宝宝这周的主要发育特点，器官发育情况，运动能力等，100-150字）

## 妈妈本周变化
（描述妈妈可能出现的身体变化、症状、注意事项等，100-150字）

## 发育重点
（这一周的关键发育里程碑，50-80字）

## 温馨提示
（给准妈妈的建议和注意事项，50-80字）

请用温暖、专业且易懂的语言，让准父母能够轻松理解。`

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
          temperature: 0.7,
          num_predict: 2000,
          top_p: 0.9
        }
      })
    })

    if (!response.ok) {
      throw new Error('AI服务连接失败')
    }

    const result = await response.json()
    const filteredContent = filterThinkingContent(result.response)
    
    const pregnancyData = {
      week: `${pregnancyInfo.weeks}周${pregnancyInfo.days}天`,
      content: filteredContent,
      timestamp: new Date().toISOString(),
      generatedAt: new Date().toISOString()
    }

    return pregnancyData

  } catch (error) {
    console.error('AI生成失败:', error)
    // 降级到预设信息
    return generateFallbackInfo(pregnancyInfo)
  }
}

// 降级预设信息
const generateFallbackInfo = (pregnancyInfo) => {
  const { weeks } = pregnancyInfo
  
  if (weeks >= 18 && weeks <= 20) {
    return `## 宝宝发育数据
- 身长：140-160 mm
- 体重：270-320 g
- 胎儿大小比喻：苹果大小

## 宝宝本周变化
宝宝的腿比胳膊长了，四肢更灵活了，能做各种动作，如踢腿、翻滚等。油腻的、像奶酪一样的胎脂开始覆盖宝宝，有助于保护宝宝娇嫩的皮肤。硬骨骼开始形成，大脑中负责视觉、听觉、味觉和嗅觉的部分正在发育。

## 妈妈本周变化
你可能出现了痔疮，必要情况可以遵医嘱外用痔疮膏，不要硬抗着哦。子宫继续增大，可能会感到腰酸背痛。胎动变得更加明显，是与宝宝交流的美好时光。注意营养均衡，适当运动。

## 发育重点
胎脂形成保护皮肤，硬骨骼开始发育，大脑感官区域快速发展。

## 温馨提示
保持愉悦心情，定期产检，注意胎动变化，适当进行胎教。`
  }
  
  // 其他孕周的默认信息...
  return `## 宝宝发育数据
- 身长：根据孕周而定
- 体重：根据孕周而定
- 胎儿大小比喻：持续成长中

## 宝宝本周变化
宝宝正在快速发育中，各个器官和系统都在不断完善。

## 妈妈本周变化
妈妈的身体在为宝宝的成长做出调整，请注意休息和营养。

## 发育重点
宝宝的各项发育指标都在正常范围内。

## 温馨提示
保持良好的生活习惯，定期进行产检。`
}

function GrowthDiary() {
  const [diaryEntries, setDiaryEntries] = useState([])
  const [newEntry, setNewEntry] = useState({
    content: '',
    type: 'note',
    mood: '😊'
  })
  const [lastMenstrualDate, setLastMenstrualDate] = useState('2025-01-15')
  const [showAddForm, setShowAddForm] = useState(false)
  const [pregnancyInfo, setPregnancyInfo] = useState(null)
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false)

  // 新增：收藏名字状态
  const [favoriteNames, setFavoriteNames] = useState(() => {
    const saved = localStorage.getItem('babyBeats_favoriteNames')
    return saved ? JSON.parse(saved) : []
  })

  // 监听收藏名字的变化
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('babyBeats_favoriteNames')
      setFavoriteNames(saved ? JSON.parse(saved) : [])
    }
    
    // 监听storage事件（跨标签页同步）
    window.addEventListener('storage', handleStorageChange)
    
    // 定期检查本地存储变化（同标签页内同步）
    const interval = setInterval(handleStorageChange, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // 计算当前孕周
  const currentPregnancyInfo = calculatePregnancyWeek(lastMenstrualDate)
  const selectedWeek = currentPregnancyInfo.weeks

  // 生成孕期信息
  const generateWeeklyInfo = async () => {
    setIsGeneratingInfo(true)
    try {
      const info = await generatePregnancyInfo(currentPregnancyInfo)
      setPregnancyInfo(info)
      
      // 保存到本地存储
      const key = `babyBeats_pregnancyInfo_${currentPregnancyInfo.weeks}_${currentPregnancyInfo.days}`
      localStorage.setItem(key, JSON.stringify(info))
    } catch (error) {
      console.error('生成孕期信息失败:', error)
    } finally {
      setIsGeneratingInfo(false)
    }
  }

  // 加载保存的孕期信息
  useEffect(() => {
    const key = `babyBeats_pregnancyInfo_${currentPregnancyInfo.weeks}_${currentPregnancyInfo.days}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        // 对加载的数据也应用过滤
        if (data.content) {
          data.content = filterThinkingContent(data.content)
        }
        setPregnancyInfo(data)
      } catch (error) {
        console.error('解析孕期信息失败:', error)
        localStorage.removeItem(key) // 清除损坏的数据
      }
    }
  }, [currentPregnancyInfo.weeks, currentPregnancyInfo.days])

  // 从本地存储加载日记
  useEffect(() => {
    const stored = localStorage.getItem('babyBeats_diary')
    if (stored) {
      try {
        const entries = JSON.parse(stored)
        // 对加载的日记条目也应用过滤
        const filteredEntries = entries.map(entry => {
          if (entry.content) {
            entry.content = filterThinkingContent(entry.content)
          }
          if (entry.answer) {
            entry.answer = filterThinkingContent(entry.answer)
          }
          return entry
        })
        setDiaryEntries(filteredEntries)
        // 更新本地存储以保存过滤后的数据
        localStorage.setItem('babyBeats_diary', JSON.stringify(filteredEntries))
      } catch (error) {
        console.error('解析日记数据失败:', error)
        localStorage.removeItem('babyBeats_diary')
      }
    }
  }, [])

  // 保存日记到本地存储
  const saveDiary = (entries) => {
    localStorage.setItem('babyBeats_diary', JSON.stringify(entries))
    setDiaryEntries(entries)
  }

  // 添加新日记
  const addDiaryEntry = () => {
    if (!newEntry.content.trim()) return

    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      week: currentPregnancyInfo.weeks,
      pregnancyWeek: `${currentPregnancyInfo.weeks}周${currentPregnancyInfo.days}天`,
      ...newEntry,
      timestamp: new Date().toLocaleString('zh-CN')
    }

    const updatedEntries = [entry, ...diaryEntries]
    saveDiary(updatedEntries)
    
    setNewEntry({ content: '', type: 'note', mood: '😊' })
    setShowAddForm(false)
  }

  // 删除日记
  const deleteDiaryEntry = (id) => {
    const updatedEntries = diaryEntries.filter(entry => entry.id !== id)
    saveDiary(updatedEntries)
  }

  // 导出日记为文本
  const exportDiary = () => {
    const diaryContent = diaryEntries.map(entry => {
      return `${entry.timestamp} - ${entry.mood}\n类型: ${entry.type}\n内容: ${entry.content}\n---\n`
    }).join('\n')

    const blob = new Blob([diaryContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `成长日记_${new Date().toLocaleDateString()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 删除收藏名字
  const deleteFavoriteName = (nameToDelete) => {
    const updatedFavorites = favoriteNames.filter(fav => fav.name !== nameToDelete)
    setFavoriteNames(updatedFavorites)
    localStorage.setItem('babyBeats_favoriteNames', JSON.stringify(updatedFavorites))
  }

  // 计算孕周信息
  const getWeekInfo = (week) => {
    const weekInfo = {
      22: { size: '约27cm', weight: '约430g', development: '听觉系统发育，能感受音乐和声音' },
      23: { size: '约28cm', weight: '约500g', development: '皮肤变厚，脂肪开始形成' },
      24: { size: '约30cm', weight: '约600g', development: '肺部继续发育，大脑迅速成长' },
      25: { size: '约32cm', weight: '约700g', development: '鼻孔开始打开，味觉发育' }
    }
    return weekInfo[week] || weekInfo[22]
  }

  const moods = ['😊', '🥰', '😍', '🤗', '🤔', '😴', '😋', '🥺']
  const entryTypes = [
    { value: 'note', label: '📝 日常记录', color: 'blue' },
    { value: 'feeling', label: '💝 感受分享', color: 'pink' },
    { value: 'milestone', label: '🌟 重要时刻', color: 'yellow' },
    { value: 'pregnancy_info', label: '📊 孕期信息', color: 'purple' }
  ]

  const filteredEntries = diaryEntries // 显示所有条目

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
              <Calendar className="text-pink-300" size={28} />
              宝宝成长日记
            </h2>
            <p className="text-white/70 mb-3">记录每一个珍贵时刻 · 当前{currentPregnancyInfo.weeks}周{currentPregnancyInfo.days}天</p>
            
            {/* 孕周配置 */}
            <div className="bg-white/10 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-white/80">末次月经:</span>
                <input
                  type="date"
                  value={lastMenstrualDate}
                  onChange={(e) => setLastMenstrualDate(e.target.value)}
                  className="bg-white/20 text-white rounded px-2 py-1 text-xs border border-white/30"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-heart-red/80 hover:bg-heart-red text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              新增记录
            </button>

            <button
              onClick={exportDiary}
              className="bg-blue-500/80 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              导出
            </button>
          </div>
        </div>

        {/* 孕周信息 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-white/60 text-sm">当前孕周</p>
            <p className="text-white font-semibold">{currentPregnancyInfo.weeks}周{currentPregnancyInfo.days}天</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm">怀孕天数</p>
            <p className="text-white font-semibold">{currentPregnancyInfo.totalDays}天</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm">距离预产期</p>
            <p className="text-white font-semibold">{currentPregnancyInfo.daysToDue}天</p>
          </div>
        </div>

        {/* 生成孕期信息按钮 */}
        <div className="mt-4 text-center">
          <button
            onClick={generateWeeklyInfo}
            disabled={isGeneratingInfo}
            className="bg-purple-500/80 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isGeneratingInfo ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                AI生成中...
              </>
            ) : (
              <>
                <Activity size={16} />
                获取本周孕期信息
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* 孕期信息展示 */}
      {pregnancyInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Baby className="text-pink-300" size={20} />
              第{pregnancyInfo.week}周{pregnancyInfo.days}天 · 孕期指南
            </h3>
            <div className="text-white/60 text-xs">
              更新于: {new Date(pregnancyInfo.generatedAt || pregnancyInfo.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="text-white/90 leading-relaxed prose prose-invert prose-sm max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 className="text-lg font-bold mb-3 text-white">{children}</h1>,
                  h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-white">{children}</h2>,
                  h3: ({children}) => <h3 className="text-sm font-medium mb-2 text-white">{children}</h3>,
                  p: ({children}) => <p className="mb-2 text-white/90">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-2 text-white/90">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside mb-2 text-white/90">{children}</ol>,
                  li: ({children}) => <li className="mb-1">{children}</li>,
                  strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({children}) => <em className="italic text-white/80">{children}</em>,
                  code: ({children}) => <code className="bg-black/20 px-1 py-0.5 rounded text-xs">{children}</code>,
                  blockquote: ({children}) => <blockquote className="border-l-2 border-purple-400 pl-3 mb-2 text-white/80">{children}</blockquote>
                }}
              >
                {pregnancyInfo.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={generateWeeklyInfo}
              disabled={isGeneratingInfo}
              className="bg-blue-500/80 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={14} />
              重新生成
            </button>
            <button
              onClick={() => {
                // 清除所有孕期信息缓存
                const keys = Object.keys(localStorage).filter(key => key.startsWith('babyBeats_pregnancyInfo_'))
                keys.forEach(key => localStorage.removeItem(key))
                setPregnancyInfo(null)
                alert('已清除孕期信息缓存，请重新生成')
              }}
              className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} />
              清除缓存
            </button>
            <button
              onClick={() => {
                const entry = {
                  id: Date.now(),
                  date: new Date().toISOString(),
                  week: currentPregnancyInfo.weeks,
                  pregnancyWeek: `${currentPregnancyInfo.weeks}周${currentPregnancyInfo.days}天`,
                  content: pregnancyInfo.content,
                  type: 'pregnancy_info',
                  mood: '📊',
                  timestamp: new Date().toLocaleString('zh-CN')
                }
                const updatedEntries = [entry, ...diaryEntries]
                saveDiary(updatedEntries)
                alert('孕期信息已保存到日记中')
              }}
              className="bg-green-500/80 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Plus size={14} />
              保存到日记
            </button>
          </div>
        </motion.div>
      )}

      {/* 收藏名字展示 */}
      {favoriteNames.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Heart className="text-pink-300" size={20} />
              收藏的名字
              <span className="text-sm text-white/60">({favoriteNames.length}个)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favoriteNames.map((favorite, index) => (
              <motion.div
                key={favorite.name + favorite.savedAt}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-white">{favorite.name}</h4>
                    {favorite.isAI && (
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                        AI
                      </span>
                    )}
                    {favorite.score && (
                      <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
                        {favorite.score}分
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteFavoriteName(favorite.name)}
                    className="text-white/50 hover:text-red-300 transition-colors p-1"
                    title="删除收藏"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <p className="text-white/80 text-sm mb-3 leading-relaxed">{favorite.meaning}</p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {favorite.structure && (
                    <div className="text-white/60">
                      <span className="text-white/80">结构:</span> {favorite.structure}
                    </div>
                  )}
                  {favorite.source && (
                    <div className="text-white/60">
                      <span className="text-white/80">来源:</span> {favorite.source}
                    </div>
                  )}
                  {favorite.elements && (
                    <div className="text-white/60">
                      <span className="text-white/80">五行:</span> {favorite.elements}
                    </div>
                  )}
                  {favorite.pronunciation && (
                    <div className="text-white/60">
                      <span className="text-white/80">音韵:</span> {favorite.pronunciation}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="text-white/50">
                    收藏于: {new Date(favorite.savedAt).toLocaleString('zh-CN')}
                  </div>
                  <div className="text-white/50">
                    来自: {favorite.parents}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {favoriteNames.length > 6 && (
            <div className="text-center mt-4">
              <p className="text-white/60 text-sm">
                📋 共收藏了 {favoriteNames.length} 个心仪的名字
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* 添加记录表单 */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-effect rounded-2xl p-6 mb-6"
          >
            <h3 className="text-white font-semibold mb-4">✨ 添加新记录</h3>
            
            <div className="space-y-4">
              {/* 类型选择 */}
              <div>
                <label className="block text-white/70 text-sm mb-2">记录类型</label>
                <div className="flex gap-2 flex-wrap">
                  {entryTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewEntry(prev => ({ ...prev, type: type.value }))}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        newEntry.type === type.value
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 心情选择 */}
              <div>
                <label className="block text-white/70 text-sm mb-2">心情</label>
                <div className="flex gap-2">
                  {moods.map(mood => (
                    <button
                      key={mood}
                      onClick={() => setNewEntry(prev => ({ ...prev, mood }))}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        newEntry.mood === mood
                          ? 'bg-white/20 scale-110'
                          : 'bg-white/10 hover:bg-white/15'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* 内容输入 */}
              <div>
                <label className="block text-white/70 text-sm mb-2">记录内容</label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="写下这一刻的感受..."
                  className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 border border-white/20 focus:border-white/40 focus:outline-none"
                  rows={4}
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={addDiaryEntry}
                  disabled={!newEntry.content.trim()}
                  className="bg-heart-red/80 hover:bg-heart-red text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  保存记录
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

      {/* 日记列表 */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-2xl p-8 text-center"
            >
              <Heart className="mx-auto text-pink-300 mb-4" size={48} />
              <h3 className="text-white font-semibold mb-2">还没有记录</h3>
              <p className="text-white/70">开始记录与宝宝的美好时光吧！</p>
            </motion.div>
          ) : (
            filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{entry.mood}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          {entry.type === 'chat' ? (
                            <MessageCircle className="text-blue-300" size={16} />
                          ) : entry.type === 'pregnancy_info' ? (
                            <Activity className="text-purple-300" size={16} />
                          ) : (
                            <Heart className="text-pink-300" size={16} />
                          )}
                          <span className="text-white font-medium">
                            {entry.type === 'chat' ? '宝宝对话' :
                             entry.type === 'feeling' ? '感受分享' :
                             entry.type === 'milestone' ? '重要时刻' : 
                             entry.type === 'pregnancy_info' ? '孕期信息' : '日常记录'}
                          </span>
                          {entry.pregnancyWeek && (
                            <span className="text-xs bg-white/20 text-white/80 px-2 py-1 rounded-full">
                              {entry.pregnancyWeek}
                            </span>
                          )}
                        </div>
                        <p className="text-white/60 text-sm">{entry.timestamp}</p>
                      </div>
                    </div>

                    {entry.type === 'chat' ? (
                      <div className="space-y-2">
                        <div className="bg-blue-500/20 rounded-lg p-3">
                          <p className="text-white/80 text-sm">问：{entry.question}</p>
                        </div>
                        <div className="bg-pink-500/20 rounded-lg p-3">
                          <p className="text-white/80 text-sm">答：{entry.answer}</p>
                        </div>
                      </div>
                    ) : entry.type === 'pregnancy_info' ? (
                      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                        <div className="text-white/90 text-sm leading-relaxed prose prose-invert prose-sm max-w-none max-h-64 overflow-y-auto">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({children}) => <h1 className="text-base font-bold mb-2 text-white">{children}</h1>,
                              h2: ({children}) => <h2 className="text-sm font-semibold mb-2 text-white">{children}</h2>,
                              h3: ({children}) => <h3 className="text-xs font-medium mb-1 text-white">{children}</h3>,
                              p: ({children}) => <p className="mb-1 text-white/90 text-xs">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-1 text-white/90 text-xs">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-1 text-white/90 text-xs">{children}</ol>,
                              li: ({children}) => <li className="mb-0.5 text-xs">{children}</li>,
                              strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                              em: ({children}) => <em className="italic text-white/80">{children}</em>,
                              code: ({children}) => <code className="bg-black/20 px-1 py-0.5 rounded text-xs">{children}</code>,
                              blockquote: ({children}) => <blockquote className="border-l-2 border-purple-400 pl-2 mb-1 text-white/80">{children}</blockquote>
                            }}
                          >
                            {entry.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/80">{entry.content}</p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteDiaryEntry(entry.id)}
                    className="text-white/50 hover:text-red-300 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 统计信息 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center text-white/60 text-sm"
      >
        📊 总共记录了 {diaryEntries.length} 个珍贵时刻
      </motion.div>
    </div>
  )
}

export default GrowthDiary 