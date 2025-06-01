import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, Heart, Copy, Check, Brain, Database, Clock, CheckCircle } from 'lucide-react'

// AI请求管理器
class AIRequestManager {
  static instance = null
  
  static getInstance() {
    if (!AIRequestManager.instance) {
      AIRequestManager.instance = new AIRequestManager()
    }
    return AIRequestManager.instance
  }
  
  constructor() {
    this.activeRequests = new Map()
    this.loadPersistedRequests()
  }
  
  // 从localStorage加载持久化的请求
  loadPersistedRequests() {
    const saved = localStorage.getItem('babyBeats_aiRequests')
    if (saved) {
      try {
        const requests = JSON.parse(saved)
        Object.entries(requests).forEach(([id, request]) => {
          if (request.status === 'processing') {
            console.log('🔄 [AI管理器] 发现未完成的请求:', id)
            // 重新发起请求
            this.continueRequest(id, request)
          }
        })
      } catch (error) {
        console.error('❌ [AI管理器] 加载持久化请求失败:', error)
      }
    }
  }
  
  // 保存请求状态到localStorage
  persistRequests() {
    const requestsData = {}
    this.activeRequests.forEach((request, id) => {
      requestsData[id] = {
        ...request,
        // 不保存Promise对象
        promise: undefined
      }
    })
    localStorage.setItem('babyBeats_aiRequests', JSON.stringify(requestsData))
  }
  
  // 开始新的AI请求
  async startRequest(requestId, parentInfo, preferences, selectedModel = 'deepseek-r1:70b') {
    console.log('🚀 [AI管理器] 开始新请求:', requestId, '使用模型:', selectedModel)
    
    const requestData = {
      id: requestId,
      parentInfo,
      preferences,
      selectedModel,
      status: 'processing',
      startTime: Date.now(),
      result: null,
      error: null
    }
    
    this.activeRequests.set(requestId, requestData)
    this.persistRequests()
    
    try {
      const result = await this.executeAIRequest(parentInfo, preferences, selectedModel)
      
      // 请求成功
      requestData.status = 'completed'
      requestData.result = result
      requestData.endTime = Date.now()
      
      console.log('✅ [AI管理器] 请求完成:', requestId)
      this.persistRequests()
      
      return result
    } catch (error) {
      // 请求失败
      requestData.status = 'failed'
      requestData.error = error.message
      requestData.endTime = Date.now()
      
      console.error('❌ [AI管理器] 请求失败:', requestId, error)
      this.persistRequests()
      
      throw error
    }
  }
  
  // 继续未完成的请求
  async continueRequest(requestId, requestData) {
    console.log('🔄 [AI管理器] 继续请求:', requestId)
    
    try {
      const result = await this.executeAIRequest(requestData.parentInfo, requestData.preferences, requestData.selectedModel)
      
      requestData.status = 'completed'
      requestData.result = result
      requestData.endTime = Date.now()
      
      this.activeRequests.set(requestId, requestData)
      this.persistRequests()
      
      console.log('✅ [AI管理器] 继续的请求完成:', requestId)
      return result
    } catch (error) {
      requestData.status = 'failed'
      requestData.error = error.message
      requestData.endTime = Date.now()
      
      this.activeRequests.set(requestId, requestData)
      this.persistRequests()
      
      console.error('❌ [AI管理器] 继续的请求失败:', requestId, error)
      throw error
    }
  }
  
  // 执行实际的AI请求
  async executeAIRequest(parentInfo, preferences, selectedModel = 'deepseek-r1:70b') {
    // 简化的提示词，更容易生成正确的JSON
    const prompt = `你是起名专家。为宝宝起名：

父亲：${parentInfo.father}
母亲：${parentInfo.mother}
性别：${preferences.gender === 'unknown' ? '未知' : preferences.gender === 'boy' ? '男孩' : '女孩'}
期望：${preferences.expectations || '健康成长'}

请生成6个名字，严格按照以下JSON格式返回：
[
  {
    "name": "完整姓名",
    "type": "男孩/女孩/中性",
    "meaning": "寓意说明",
    "source": "来源",
    "structure": "单字名/双字名",
    "score": 85,
    "elements": "五行属性",
    "pronunciation": "读音特点"
  }
]

只返回JSON数组，不要其他文字：`

    console.log('📝 [AI管理器] 提示词长度:', prompt.length, '字符')
    
    // 模型列表，将用户选择的模型放在首位，其他作为备选 - 所有超时都是30分钟
    const allModels = [
      { name: 'deepseek-r1:70b', timeout: 1800000, description: 'DeepSeek R1 70B（高质量）' },
      { name: 'qwen3:32b', timeout: 1800000, description: 'Qwen3 32B（平衡）' },
      { name: 'llama3.2:latest', timeout: 1800000, description: 'Llama3.2（快速）' }
    ]
    
    // 重新排序，将用户选择的模型放在首位
    const models = allModels.filter(m => m.name === selectedModel)
      .concat(allModels.filter(m => m.name !== selectedModel))
    
    for (let i = 0; i < models.length; i++) {
      const model = models[i]
      console.log(`🤖 [AI管理器] 尝试模型 ${i + 1}/${models.length}: ${model.description}`)
      
      try {
        const result = await this.tryModelRequest(prompt, model)
        console.log(`✅ [AI管理器] 模型 ${model.name} 成功返回结果`)
        return result
      } catch (error) {
        console.warn(`⚠️ [AI管理器] 模型 ${model.name} 失败:`, error.message)
        
        if (i === models.length - 1) {
          // 所有模型都失败了
          console.error('💥 [AI管理器] 所有模型都失败了')
          throw new Error('所有AI模型都无法响应，请稍后重试')
        }
        
        console.log(`🔄 [AI管理器] 切换到下一个模型...`)
      }
    }
  }
  
  // 尝试单个模型请求
  async tryModelRequest(prompt, model) {
    console.log(`⏰ [AI管理器] 开始调用 ${model.name}，超时设置: ${model.timeout}ms`)

    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ [AI管理器] ${model.name} 请求超时，正在取消...`)
      controller.abort()
    }, model.timeout)

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model.name,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.8,
            max_tokens: 3000,
            top_p: 0.9
          }
        }),
        signal: controller.signal // 添加取消信号
      })

      clearTimeout(timeoutId) // 清除超时定时器

      if (!response.ok) {
        console.error(`❌ [AI管理器] ${model.name} HTTP错误:`, response.status, response.statusText)
        if (response.status === 408 || response.status === 504) {
          throw new Error(`${model.name} 服务响应超时`)
        }
        throw new Error(`${model.name} 连接失败`)
      }

      console.log(`✅ [AI管理器] ${model.name} API调用成功，开始解析响应...`)
      const result = await response.json()
      
      // 过滤DeepSeek R1的<think>标签内容
      let filteredResponse = result.response
      if (filteredResponse) {
        console.log(`🧹 [AI管理器] ${model.name} 开始过滤<think>标签...`)
        filteredResponse = filteredResponse.replace(/<think>[\s\S]*?<\/think>/gi, '')
        filteredResponse = filteredResponse.replace(/<\/?think>/gi, '')
        filteredResponse = filteredResponse.trim()
        console.log(`✅ [AI管理器] ${model.name} <think>标签过滤完成`)
      }

      // 解析JSON
      console.log(`📋 [AI管理器] ${model.name} 开始解析JSON格式...`)
      
      // 尝试多种JSON解析方法
      let aiSuggestions = null
      
      // 方法1：直接查找JSON数组
      const jsonMatch = filteredResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        try {
          console.log(`🔍 [AI管理器] ${model.name} 找到JSON数组，尝试解析...`)
          aiSuggestions = JSON.parse(jsonMatch[0])
          console.log(`🎉 [AI管理器] ${model.name} JSON解析成功，名字数量:`, aiSuggestions.length)
        } catch (parseError) {
          console.warn(`⚠️ [AI管理器] ${model.name} JSON解析失败:`, parseError.message)
        }
      }
      
      // 方法2：尝试解析整个响应
      if (!aiSuggestions) {
        try {
          console.log(`🔄 [AI管理器] ${model.name} 尝试解析整个响应...`)
          aiSuggestions = JSON.parse(filteredResponse)
          console.log(`✅ [AI管理器] ${model.name} 整体解析成功，名字数量:`, aiSuggestions.length)
        } catch (parseError) {
          console.warn(`⚠️ [AI管理器] ${model.name} 整体解析失败:`, parseError.message)
        }
      }
      
      if (aiSuggestions && Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
        // 验证数据格式
        const validSuggestions = aiSuggestions.filter(suggestion => 
          suggestion && 
          typeof suggestion === 'object' && 
          suggestion.name && 
          suggestion.meaning
        )
        
        if (validSuggestions.length > 0) {
          console.log(`🎯 [AI管理器] ${model.name} 有效名字数量:`, validSuggestions.length)
          return validSuggestions.slice(0, 12)
        }
      }
      
      console.warn(`⚠️ [AI管理器] ${model.name} 未找到有效的JSON格式数组`)
      console.log(`📝 [AI管理器] ${model.name} 响应内容:`, filteredResponse.substring(0, 300))
      throw new Error(`${model.name} 返回格式不正确`)
    } catch (error) {
      clearTimeout(timeoutId) // 确保清除超时定时器
      
      if (error.name === 'AbortError') {
        console.error(`⏰ [AI管理器] ${model.name} 请求被取消（超时）`)
        throw new Error(`${model.name} 分析超时`)
      }
      
      console.error(`💥 [AI管理器] ${model.name} 请求失败:`, error.message)
      throw error
    }
  }
  
  // 获取请求状态
  getRequestStatus(requestId) {
    return this.activeRequests.get(requestId) || null
  }
  
  // 清除完成的请求
  clearRequest(requestId) {
    this.activeRequests.delete(requestId)
    this.persistRequests()
  }
  
  // 获取所有活动请求
  getAllRequests() {
    return Array.from(this.activeRequests.values())
  }
}

function NameGame() {
  // 从localStorage初始化状态
  const [parentNames, setParentNames] = useState(() => {
    const saved = localStorage.getItem('babyBeats_nameGame_parentNames')
    return saved ? JSON.parse(saved) : { father: '', mother: '' }
  })
  
  const [babyGender, setBabyGender] = useState(() => {
    const saved = localStorage.getItem('babyBeats_nameGame_babyGender')
    return saved || 'unknown'
  })
  
  const [suggestions, setSuggestions] = useState(() => {
    const saved = localStorage.getItem('babyBeats_nameGame_suggestions')
    return saved ? JSON.parse(saved) : []
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedName, setCopiedName] = useState('')
  
  const [namingMode, setNamingMode] = useState(() => {
    const saved = localStorage.getItem('babyBeats_nameGame_namingMode')
    return saved || 'ai'
  })
  
  const [additionalInfo, setAdditionalInfo] = useState(() => {
    const saved = localStorage.getItem('babyBeats_nameGame_additionalInfo')
    return saved ? JSON.parse(saved) : {
      birthDate: '',
      expectations: '',
      culturalPreference: 'traditional'
    }
  })

  // 新增：AI模型选择状态
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('babyBeats_nameGame_selectedModel')
    return saved || 'deepseek-r1:70b'
  })

  // 新增：历史记录状态
  const [nameHistory, setNameHistory] = useState(() => {
    const saved = localStorage.getItem('babyBeats_nameGame_history')
    return saved ? JSON.parse(saved) : []
  })

  // 新增：AI请求状态管理
  const [currentRequestId, setCurrentRequestId] = useState(null)
  const [requestStatus, setRequestStatus] = useState(null)
  const aiManager = AIRequestManager.getInstance()

  // 检查是否有正在进行的请求
  useEffect(() => {
    console.log('🔍 [组件] 检查是否有正在进行的AI请求...')
    const activeRequests = aiManager.getAllRequests()
    const ongoingRequest = activeRequests.find(req => req.status === 'processing')
    
    if (ongoingRequest) {
      console.log('🔄 [组件] 发现正在进行的请求:', ongoingRequest.id)
      setCurrentRequestId(ongoingRequest.id)
      setRequestStatus(ongoingRequest)
      setIsGenerating(true)
      
      // 监听请求完成
      monitorRequest(ongoingRequest.id)
    }

    // 检查是否有已完成但未显示的请求
    const completedRequest = activeRequests.find(req => req.status === 'completed')
    if (completedRequest && completedRequest.result) {
      console.log('✅ [组件] 发现已完成的请求结果:', completedRequest.id)
      displayAIResults(completedRequest.result)
      aiManager.clearRequest(completedRequest.id)
    }
  }, [])

  // 监听请求状态变化
  const monitorRequest = async (requestId) => {
    console.log('👀 [组件] 开始监控请求:', requestId)
    
    const checkInterval = setInterval(() => {
      const status = aiManager.getRequestStatus(requestId)
      if (status) {
        setRequestStatus(status)
        
        const elapsedTime = Math.floor((Date.now() - status.startTime) / 1000)
        console.log(`⏱️ [组件] 请求进行中，已耗时: ${elapsedTime}秒`)
        
        if (status.status === 'completed') {
          console.log('🎉 [组件] 请求完成，显示结果')
          clearInterval(checkInterval)
          setIsGenerating(false)
          setCurrentRequestId(null)
          
          if (status.result) {
            displayAIResults(status.result)
          }
          aiManager.clearRequest(requestId)
          
        } else if (status.status === 'failed') {
          console.error('❌ [组件] 请求失败:', status.error)
          clearInterval(checkInterval)
          setIsGenerating(false)
          setCurrentRequestId(null)
          setRequestStatus(null)
          
          // 显示错误信息
          alert(`AI分析失败: ${status.error || '未知错误'}`)
          
          // 切换到传统模式
          const traditionalResults = generateTraditionalNames()
          setSuggestions(traditionalResults.map(s => ({ ...s, isAI: false })))
          aiManager.clearRequest(requestId)
        }
      } else {
        // 请求不存在，可能已被清除
        console.warn('⚠️ [组件] 请求状态丢失，停止监控')
        clearInterval(checkInterval)
        setIsGenerating(false)
        setCurrentRequestId(null)
        setRequestStatus(null)
      }
    }, 2000) // 每2秒检查一次，减少频率

    // 设置超时（10分钟）
    setTimeout(() => {
      clearInterval(checkInterval)
      const currentStatus = aiManager.getRequestStatus(requestId)
      if (currentStatus?.status === 'processing') {
        console.warn('⏰ [组件] 请求监控超时（10分钟）')
        setIsGenerating(false)
        setCurrentRequestId(null)
        setRequestStatus(null)
        
        // 显示超时提示
        alert('AI分析超时，已自动切换到传统起名模式')
        
        // 切换到传统模式
        const traditionalResults = generateTraditionalNames()
        setSuggestions(traditionalResults.map(s => ({ ...s, isAI: false })))
        
        aiManager.clearRequest(requestId)
      }
    }, 10 * 60 * 1000) // 10分钟超时
  }

  // 显示AI结果
  const displayAIResults = (aiResults) => {
    const formattedResults = aiResults.map(suggestion => ({
      ...suggestion,
      isAI: true
    }))
    setSuggestions(formattedResults)
    
    // 保存到历史记录
    const historyRecord = {
      id: `history_${Date.now()}`,
      timestamp: new Date().toISOString(),
      parentNames: { ...parentNames },
      babyGender,
      namingMode: 'ai',
      selectedModel,
      additionalInfo: { ...additionalInfo },
      results: formattedResults,
      resultCount: formattedResults.length
    }
    
    setNameHistory(prev => [historyRecord, ...prev.slice(0, 19)]) // 保留最新20条记录
    console.log('✨ [组件] AI结果已显示，数量:', formattedResults.length, '并已保存到历史记录')
  }

  // 保存状态到localStorage
  useEffect(() => {
    console.log('💾 [数据持久化] 保存父母姓名到本地存储')
    localStorage.setItem('babyBeats_nameGame_parentNames', JSON.stringify(parentNames))
  }, [parentNames])

  useEffect(() => {
    console.log('💾 [数据持久化] 保存宝宝性别到本地存储:', babyGender)
    localStorage.setItem('babyBeats_nameGame_babyGender', babyGender)
  }, [babyGender])

  useEffect(() => {
    console.log('💾 [数据持久化] 保存起名模式到本地存储:', namingMode)
    localStorage.setItem('babyBeats_nameGame_namingMode', namingMode)
  }, [namingMode])

  useEffect(() => {
    console.log('💾 [数据持久化] 保存额外信息到本地存储')
    localStorage.setItem('babyBeats_nameGame_additionalInfo', JSON.stringify(additionalInfo))
  }, [additionalInfo])

  useEffect(() => {
    console.log('💾 [数据持久化] 保存选择的AI模型到本地存储:', selectedModel)
    localStorage.setItem('babyBeats_nameGame_selectedModel', selectedModel)
  }, [selectedModel])

  useEffect(() => {
    console.log('💾 [数据持久化] 保存历史记录到本地存储:', nameHistory.length, '条记录')
    localStorage.setItem('babyBeats_nameGame_history', JSON.stringify(nameHistory))
  }, [nameHistory])

  // 保存建议结果
  useEffect(() => {
    if (suggestions.length > 0) {
      console.log('💾 [数据持久化] 保存生成结果到本地存储:', suggestions.length, '个名字')
      localStorage.setItem('babyBeats_nameGame_suggestions', JSON.stringify(suggestions))
    }
  }, [suggestions])

  // 名字库
  const nameDatabase = {
    boy: {
      single: ['轩', '宇', '晨', '睿', '泽', '瑞', '博', '昊', '辰', '煜', '熙', '洋', '豪', '杰', '浩', '翔', '康', '乐', '智', '明'],
      double: ['浩然', '子轩', '梓豪', '子涵', '浩宇', '明轩', '天佑', '文昊', '子墨', '博文', '天翊', '昊天', '智宸', '正豪', '建华']
    },
    girl: {
      single: ['涵', '萱', '怡', '彤', '琪', '雅', '欣', '妍', '婷', '蕾', '心', '语', '可', '馨', '娅', '梦', '诗', '佳', '思', '静'],
      double: ['雨萱', '梓涵', '欣怡', '子萱', '思涵', '诗涵', '梦琪', '心怡', '语嫣', '雅涵', '若汐', '艺涵', '苡沫', '语桐', '语汐']
    },
    neutral: {
      single: ['安', '乐', '悦', '宁', '和', '嘉', '祥', '福', '康', '健', '平', '喜', '慧', '智', '德', '仁', '义', '礼', '信', '爱'],
      double: ['安然', '乐言', '悦心', '宁静', '和悦', '嘉慧', '祥瑞', '福康', '康宁', '健安', '平安', '喜悦', '慧心', '智德']
    }
  }

  // 寓意解释
  const meanings = {
    '轩': '气宇轩昂，前程似锦',
    '宇': '胸怀宇宙，志向远大',
    '晨': '朝气蓬勃，充满希望',
    '睿': '睿智聪颖，洞察力强',
    '泽': '恩泽深厚，福泽绵长',
    '瑞': '祥瑞吉利，福星高照',
    '涵': '内涵丰富，包容大度',
    '萱': '快乐无忧，美丽动人',
    '怡': '怡然自得，心情愉悦',
    '彤': '红彤彤的，象征吉祥',
    '安': '平安健康，安居乐业',
    '乐': '快乐幸福，乐观向上',
    '浩然': '正大光明，浩然正气',
    '雨萱': '如雨后萱草，美丽纯洁',
    '安然': '安然无恙，平静祥和'
  }

  // 生成名字建议
  const generateNames = async () => {
    if (!parentNames.father.trim() || !parentNames.mother.trim()) {
      console.warn('⚠️ [起名流程] 父母姓名未完整填写')
      alert('请输入父母双方的姓名')
      return
    }

    console.log('🎬 [起名流程] ================ 开始生成名字 ================')
    console.log('👨‍👩‍👦 [起名流程] 输入信息检查:', {
      父亲姓名: parentNames.father,
      母亲姓名: parentNames.mother,
      宝宝性别: babyGender,
      起名模式: namingMode,
      额外信息: additionalInfo
    })

    setIsGenerating(true)
    const processStartTime = Date.now()
    
    try {
      let newSuggestions = []

      if (namingMode === 'ai') {
        console.log('🤖 [起名流程] 选择AI智能起名模式')
        
        // 生成唯一的请求ID
        const requestId = `naming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setCurrentRequestId(requestId)
        
        try {
          console.log('📤 [起名流程] 通过AI管理器发起请求:', requestId)
          
          // 使用AI请求管理器
          const aiResults = await aiManager.startRequest(requestId, parentNames, {
            gender: babyGender,
            birthDate: additionalInfo.birthDate,
            expectations: additionalInfo.expectations,
            culturalPreference: additionalInfo.culturalPreference
          }, selectedModel)
          
          console.log('✅ [起名流程] AI管理器返回结果')
          displayAIResults(aiResults)
          setCurrentRequestId(null)
          
        } catch (aiError) {
          console.warn('⚠️ [起名流程] AI模式失败，错误信息:', aiError.message)
          console.log('🔄 [起名流程] 自动切换到传统模式作为备选...')
          setCurrentRequestId(null)
          
          // 显示详细错误信息
          const errorMessage = aiError.message.includes('超时') 
            ? 'AI分析超时，可能是模型响应较慢，已自动切换到传统模式'
            : `AI分析失败：${aiError.message}，已自动切换到传统模式`
          
          console.log('📢 [起名流程] 错误提示:', errorMessage)
          
          // AI失败时自动切换到传统模式
          newSuggestions = generateTraditionalNames()
          setSuggestions(newSuggestions.map(s => ({ ...s, isAI: false })))
          
          // 保存备选传统模式历史记录
          const fallbackResults = newSuggestions.map(s => ({ ...s, isAI: false }))
          const fallbackHistoryRecord = {
            id: `history_${Date.now()}`,
            timestamp: new Date().toISOString(),
            parentNames: { ...parentNames },
            babyGender,
            namingMode: 'traditional', // AI失败后的传统备选
            selectedModel: null,
            additionalInfo: { ...additionalInfo },
            results: fallbackResults,
            resultCount: fallbackResults.length,
            note: `AI模式失败后的传统备选 (${aiError.message})`
          }
          setNameHistory(prev => [fallbackHistoryRecord, ...prev.slice(0, 19)])
          
          console.log('🎯 [起名流程] 传统模式备选完成，名字数量:', newSuggestions.length)
          
          // 显示友好的错误提示
          setTimeout(() => {
            alert(errorMessage)
          }, 500)
        }
      } else {
        console.log('📚 [起名流程] 选择传统起名模式')
        // 传统模式
        newSuggestions = generateTraditionalNames()
        setSuggestions(newSuggestions.map(s => ({ ...s, isAI: false })))
        
        // 保存传统模式历史记录
        const traditionalResults = newSuggestions.map(s => ({ ...s, isAI: false }))
        const historyRecord = {
          id: `history_${Date.now()}`,
          timestamp: new Date().toISOString(),
          parentNames: { ...parentNames },
          babyGender,
          namingMode: 'traditional',
          selectedModel: null,
          additionalInfo: { ...additionalInfo },
          results: traditionalResults,
          resultCount: traditionalResults.length
        }
        setNameHistory(prev => [historyRecord, ...prev.slice(0, 19)]) // 保留最新20条记录
        
        console.log('🎯 [起名流程] 传统模式生成完成，名字数量:', newSuggestions.length)
      }

      const totalTime = Date.now() - processStartTime
      console.log('🎉 [起名流程] ================ 生成完成 ================')
      console.log('⏱️ [起名流程] 总耗时:', totalTime, 'ms')
      
    } catch (error) {
      console.error('💥 [起名流程] 整体流程失败:', error.message)
      console.error('📍 [起名流程] 错误堆栈:', error.stack)
      setCurrentRequestId(null)
      alert('起名过程中出现错误，请稍后重试')
    } finally {
      if (!currentRequestId) {
        setIsGenerating(false)
      }
      const finalTime = Date.now() - processStartTime
      console.log('🏁 [起名流程] 流程结束，总耗时:', finalTime, 'ms')
    }
  }

  // 传统起名方法（保留原有逻辑）
  const generateTraditionalNames = () => {
    console.log('📚 [传统起名] 开始传统起名算法...')
    
    const newSuggestions = []
    const genderTypes = babyGender === 'unknown' ? ['boy', 'girl', 'neutral'] : [babyGender, 'neutral']
    
    console.log('🎯 [传统起名] 性别类型:', genderTypes)
    
    // 获取父母姓氏
    const fatherSurname = parentNames.father.charAt(0)
    const motherSurname = parentNames.mother.charAt(0)
    
    console.log('👨‍👩‍👦 [传统起名] 姓氏信息:', {
      父亲姓氏: fatherSurname,
      母亲姓氏: motherSurname
    })
    
    genderTypes.forEach((gender, genderIndex) => {
      console.log(`🔄 [传统起名] 处理第${genderIndex + 1}种类型: ${gender}`)
      const names = nameDatabase[gender]
      
      // 单字名
      const singleNames = [...names.single].sort(() => Math.random() - 0.5).slice(0, 3)
      console.log(`📝 [传统起名] ${gender}类型单字名:`, singleNames)
      
      singleNames.forEach(name => {
        // 随机选择父姓或母姓
        const surname = Math.random() > 0.5 ? fatherSurname : motherSurname
        const fullName = surname + name
        newSuggestions.push({
          name: fullName,
          type: gender === 'neutral' ? '中性' : gender === 'boy' ? '男孩' : '女孩',
          meaning: meanings[name] || '美好寓意，健康成长',
          structure: '单字名',
          source: `取自${surname === fatherSurname ? '父' : '母'}姓`,
          score: Math.floor(Math.random() * 20) + 80, // 80-99分
          elements: '综合平衡',
          pronunciation: '音韵和谐',
          isAI: false
        })
      })
      
      // 双字名
      const doubleNames = [...names.double].sort(() => Math.random() - 0.5).slice(0, 2)
      console.log(`📝 [传统起名] ${gender}类型双字名:`, doubleNames)
      
      doubleNames.forEach(name => {
        const surname = Math.random() > 0.5 ? fatherSurname : motherSurname
        const fullName = surname + name
        newSuggestions.push({
          name: fullName,
          type: gender === 'neutral' ? '中性' : gender === 'boy' ? '男孩' : '女孩',
          meaning: meanings[name] || '美好寓意，前程似锦',
          structure: '双字名',
          source: `取自${surname === fatherSurname ? '父' : '母'}姓`,
          score: Math.floor(Math.random() * 20) + 80, // 80-99分
          elements: '五行调和',
          pronunciation: '朗朗上口',
          isAI: false
        })
      })
    })
    
    // 特殊组合：结合父母名字
    console.log('✨ [传统起名] 生成特殊组合名字...')
    const specialCombos = generateSpecialCombos()
    console.log('🎯 [传统起名] 特殊组合结果:', specialCombos.map(c => c.name))
    newSuggestions.push(...specialCombos)
    
    const finalResults = newSuggestions.slice(0, 12)
    console.log('📊 [传统起名] 传统算法完成:', {
      总生成数: newSuggestions.length,
      最终返回: finalResults.length,
      单字名数量: finalResults.filter(s => s.structure === '单字名').length,
      双字名数量: finalResults.filter(s => s.structure === '双字名').length,
      组合名数量: finalResults.filter(s => s.structure === '组合名').length
    })
    
    return finalResults
  }

  // 生成特殊组合名字
  const generateSpecialCombos = () => {
    const combos = []
    const fatherName = parentNames.father
    const motherName = parentNames.mother
    
    if (fatherName.length >= 2 && motherName.length >= 2) {
      // 父姓 + 母名最后一字
      const combo1 = fatherName.charAt(0) + motherName.charAt(motherName.length - 1)
      combos.push({
        name: combo1,
        type: '特殊',
        meaning: '融合父母之爱，承载双重期望',
        structure: '组合名',
        source: '父姓+母名',
        score: Math.floor(Math.random() * 15) + 85, // 85-99分
        elements: '阴阳调和',
        pronunciation: '独特韵味',
        isAI: false
      })
      
      // 母姓 + 父名最后一字
      const combo2 = motherName.charAt(0) + fatherName.charAt(fatherName.length - 1)
      combos.push({
        name: combo2,
        type: '特殊',
        meaning: '结合双方特色，独一无二',
        structure: '组合名',
        source: '母姓+父名',
        score: Math.floor(Math.random() * 15) + 85, // 85-99分
        elements: '刚柔并济',
        pronunciation: '别具一格',
        isAI: false
      })
    }
    
    return combos
  }

  // 复制名字到剪贴板
  const copyToClipboard = (name) => {
    navigator.clipboard.writeText(name).then(() => {
      setCopiedName(name)
      setTimeout(() => setCopiedName(''), 2000)
    })
  }

  // 保存喜欢的名字
  const saveFavoriteName = (nameData) => {
    const favorites = JSON.parse(localStorage.getItem('babyBeats_favoriteNames') || '[]')
    const exists = favorites.some(fav => fav.name === nameData.name)
    
    if (!exists) {
      favorites.push({
        ...nameData,
        savedAt: new Date().toISOString(),
        parents: `${parentNames.father} & ${parentNames.mother}`
      })
      localStorage.setItem('babyBeats_favoriteNames', JSON.stringify(favorites))
      alert(`已收藏名字：${nameData.name}`)
    } else {
      alert('这个名字已经在收藏夹中了')
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case '男孩': return 'bg-blue-500/20 text-blue-300'
      case '女孩': return 'bg-pink-500/20 text-pink-300'
      case '中性': return 'bg-green-500/20 text-green-300'
      case '特殊': return 'bg-purple-500/20 text-purple-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  // 清除所有数据，重新开始
  const clearAllData = () => {
    console.log('🗑️ [数据清理] 用户请求清除所有数据')
    const confirmClear = window.confirm('确定要清除所有输入内容和生成结果吗？')
    if (confirmClear) {
      console.log('✅ [数据清理] 用户确认清除，开始执行...')
      
      // 重置状态
      console.log('🔄 [数据清理] 重置React状态...')
      setParentNames({ father: '', mother: '' })
      setBabyGender('unknown')
      setSuggestions([])
      setNamingMode('ai')
      setAdditionalInfo({
        birthDate: '',
        expectations: '',
        culturalPreference: 'traditional'
      })
      
      // 清除localStorage
      console.log('🧹 [数据清理] 清除本地存储数据...')
      const keysToRemove = [
        'babyBeats_nameGame_parentNames',
        'babyBeats_nameGame_babyGender',
        'babyBeats_nameGame_suggestions',
        'babyBeats_nameGame_namingMode',
        'babyBeats_nameGame_additionalInfo'
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ [数据清理] 已清除: ${key}`)
      })
      
      console.log('🎉 [数据清理] 清理完成！')
      alert('已清除所有数据，可以重新开始了！')
    } else {
      console.log('❌ [数据清理] 用户取消清除操作')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 输入面板 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-6 mb-6"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="text-yellow-300" size={28} />
            宝宝起名游戏
          </h2>
          <p className="text-white/70">结合父母姓名，为宝宝生成美好的名字</p>
          
          {/* 模式选择 */}
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={() => setNamingMode('ai')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                namingMode === 'ai'
                  ? 'bg-purple-500/80 text-white'
                  : 'bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              <Brain size={18} />
              AI智能起名
            </button>
            <button
              onClick={() => setNamingMode('traditional')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                namingMode === 'traditional'
                  ? 'bg-blue-500/80 text-white'
                  : 'bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              <Database size={18} />
              传统起名
            </button>
            <button
              onClick={clearAllData}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-sm"
              title="清除所有数据重新开始"
            >
              <RefreshCw size={16} />
              重置
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 父母姓名输入 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">爸爸姓名</label>
              <input
                type="text"
                value={parentNames.father}
                onChange={(e) => setParentNames(prev => ({ ...prev, father: e.target.value }))}
                placeholder="请输入爸爸的姓名"
                className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 border border-white/20 focus:border-white/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">妈妈姓名</label>
              <input
                type="text"
                value={parentNames.mother}
                onChange={(e) => setParentNames(prev => ({ ...prev, mother: e.target.value }))}
                placeholder="请输入妈妈的姓名"
                className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 border border-white/20 focus:border-white/40 focus:outline-none"
              />
            </div>
          </div>

          {/* 性别选择 */}
          <div>
            <label className="block text-white/70 text-sm mb-3">宝宝性别（可选）</label>
            <div className="flex gap-3">
              {[
                { value: 'unknown', label: '还不知道', icon: '❓' },
                { value: 'boy', label: '男宝宝', icon: '👶' },
                { value: 'girl', label: '女宝宝', icon: '👧' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setBabyGender(option.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    babyGender === option.value
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI模式的额外字段 */}
          {namingMode === 'ai' && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 border-t border-white/20 pt-4"
              >
                <h3 className="text-white font-semibold text-center mb-3">🤖 AI智能分析</h3>
                
                {/* AI模型选择 */}
                <div className="mb-4">
                  <label className="block text-white/70 text-sm mb-2">选择AI模型</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-white/10 text-white rounded-lg px-4 py-3 border border-white/20 focus:border-white/40 focus:outline-none"
                  >
                    <option value="deepseek-r1:70b" className="bg-purple-800">🧠 DeepSeek R1 70B - 高质量分析（推荐）</option>
                    <option value="qwen3:32b" className="bg-purple-800">⚡ Qwen3 32B - 平衡性能与速度</option>
                    <option value="llama3.2:latest" className="bg-purple-800">🚀 Llama 3.2 - 快速响应</option>
                  </select>
                  <div className="text-xs text-white/60 mt-2">
                    💡 所有模型超时时间已设为30分钟，确保充分分析
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">预产期（可选）</label>
                    <input
                      type="date"
                      value={additionalInfo.birthDate}
                      onChange={(e) => setAdditionalInfo(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full bg-white/10 text-white rounded-lg px-4 py-3 border border-white/20 focus:border-white/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">文化偏好</label>
                    <select
                      value={additionalInfo.culturalPreference}
                      onChange={(e) => setAdditionalInfo(prev => ({ ...prev, culturalPreference: e.target.value }))}
                      className="w-full bg-white/10 text-white rounded-lg px-4 py-3 border border-white/20 focus:border-white/40 focus:outline-none"
                    >
                      <option value="traditional" className="bg-purple-800">传统文化</option>
                      <option value="modern" className="bg-purple-800">现代时尚</option>
                      <option value="mixed" className="bg-purple-800">中西结合</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">对宝宝的期望</label>
                  <textarea
                    value={additionalInfo.expectations}
                    onChange={(e) => setAdditionalInfo(prev => ({ ...prev, expectations: e.target.value }))}
                    placeholder="比如：健康成长、聪明伶俐、前程似锦..."
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 border border-white/20 focus:border-white/40 focus:outline-none"
                    rows={3}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* 加载指示器 */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-pink-400/80 text-white px-6 py-4 rounded-2xl max-w-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="animate-bounce">💭</div>
                  <span className="font-medium">
                    {namingMode === 'ai' ? 'AI大师正在分析...' : '正在生成名字...'}
                  </span>
                </div>
                
                {/* AI分析进度详情 */}
                {namingMode === 'ai' && requestStatus && (
                  <div className="text-sm text-white/90 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>
                        已运行 {Math.floor((Date.now() - requestStatus.startTime) / 1000)} 秒
                      </span>
                    </div>
                    
                    {currentRequestId && (
                      <div className="text-xs text-white/70">
                        请求ID: {currentRequestId.split('_')[2]}
                      </div>
                    )}
                    
                    <div className="text-xs text-white/80">
                      🤖 正在尝试多个AI模型，确保最佳效果
                    </div>
                    
                    <div className="text-xs text-white/80">
                      💡 切换标签不会中断分析，回来时可以看到结果
                    </div>
                    
                    {/* 进度条 */}
                    <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min((Date.now() - requestStatus.startTime) / (5 * 60 * 1000) * 100, 95)}%`
                        }}
                      />
                    </div>
                    
                    {/* 手动重试按钮 */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          if (currentRequestId) {
                            aiManager.clearRequest(currentRequestId)
                            setCurrentRequestId(null)
                            setRequestStatus(null)
                            setIsGenerating(false)
                            alert('已取消当前AI分析')
                          }
                        }}
                        className="text-xs bg-red-500/30 hover:bg-red-500/50 px-3 py-1 rounded transition-colors"
                      >
                        取消分析
                      </button>
                      
                      <button
                        onClick={() => {
                          // 切换到传统模式并立即生成
                          setNamingMode('traditional')
                          setTimeout(() => {
                            const traditionalResults = generateTraditionalNames()
                            setSuggestions(traditionalResults.map(s => ({ ...s, isAI: false })))
                            setIsGenerating(false)
                          }, 100)
                        }}
                        className="text-xs bg-blue-500/30 hover:bg-blue-500/50 px-3 py-1 rounded transition-colors"
                      >
                        改用传统模式
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 传统模式简单提示 */}
                {namingMode === 'traditional' && (
                  <div className="text-sm text-white/90">
                    正在从名字库中筛选最佳组合...
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 生成按钮 */}
          <div className="flex justify-center gap-3">
            <motion.button
              onClick={generateNames}
              disabled={isGenerating || !parentNames.father.trim() || !parentNames.mother.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  {namingMode === 'ai' ? 'AI分析中...' : '正在生成...'}
                </>
              ) : (
                <>
                  {namingMode === 'ai' ? <Brain size={20} /> : <Sparkles size={20} />}
                  {namingMode === 'ai' ? 'AI智能起名' : '生成名字'}
                </>
              )}
            </motion.button>
            
            {/* 调试按钮 */}
            {namingMode === 'ai' && process.env.NODE_ENV === 'development' && (
              <button
                onClick={async () => {
                  console.log('🧪 [调试] 开始AI连接测试...')
                  try {
                    const testResult = await aiManager.tryModelRequest(
                      '简单测试：为张三李四的宝宝起一个名字，返回JSON格式：[{"name":"张小明","meaning":"聪明"}]',
                      { name: 'llama3.2:latest', timeout: 20000, description: '测试' }
                    )
                    console.log('✅ [调试] AI测试成功:', testResult)
                    alert('AI连接测试成功！')
                  } catch (error) {
                    console.error('❌ [调试] AI测试失败:', error)
                    alert(`AI测试失败: ${error.message}`)
                  }
                }}
                className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-4 py-3 rounded-lg text-sm transition-colors"
              >
                🧪 测试AI
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 历史记录 */}
      {nameHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-6 mb-6"
        >
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            📚 历史记录
            <span className="text-sm text-white/60">({nameHistory.length}条)</span>
          </h3>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {nameHistory.slice(0, 5).map((record) => (
              <div
                key={record.id}
                className="bg-white/5 rounded-lg p-3 border border-white/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-sm">
                      {record.parentNames.father} & {record.parentNames.mother}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      record.namingMode === 'ai' 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {record.namingMode === 'ai' ? 'AI智能' : '传统'}
                    </span>
                  </div>
                  <div className="text-white/50 text-xs">
                    {new Date(record.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {record.results.slice(0, 6).map((name, idx) => (
                    <span 
                      key={idx}
                      className="text-white/70 text-xs bg-white/10 px-2 py-1 rounded cursor-pointer hover:bg-white/20 transition-colors"
                      onClick={() => copyToClipboard(name.name)}
                      title={`${name.name}: ${name.meaning}`}
                    >
                      {name.name}
                    </span>
                  ))}
                  {record.results.length > 6 && (
                    <span className="text-white/50 text-xs">
                      +{record.results.length - 6}个
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setSuggestions(record.results)
                    setParentNames(record.parentNames)
                    setBabyGender(record.babyGender)
                    if (record.selectedModel) {
                      setSelectedModel(record.selectedModel)
                    }
                    setAdditionalInfo(record.additionalInfo)
                    setNamingMode(record.namingMode)
                  }}
                  className="text-blue-300 hover:text-blue-200 text-xs transition-colors"
                >
                  📋 恢复此次配置
                </button>
              </div>
            ))}
          </div>
          
          {nameHistory.length > 5 && (
            <div className="text-center mt-3">
              <button
                onClick={() => {
                  // 可以添加查看全部历史记录的功能
                  alert(`共有 ${nameHistory.length} 条历史记录`)
                }}
                className="text-white/60 hover:text-white/80 text-sm transition-colors"
              >
                查看全部历史记录 ({nameHistory.length}条)
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* 名字建议列表 */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-white font-semibold text-lg text-center mb-6">
              ✨ 为您生成了 {suggestions.length} 个美好的名字
              <span className="text-white/60 text-sm block mt-1">
                💾 您的输入内容已自动保存，切换标签不会丢失
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-effect rounded-xl p-4 border border-white/20"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{suggestion.name}</h3>
                      {suggestion.isAI && (
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(suggestion.type)}`}>
                        {suggestion.type}
                      </span>
                      {suggestion.score && (
                        <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
                          {suggestion.score}分
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-white/80 text-sm leading-relaxed">{suggestion.meaning}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-white/60">
                        <span className="text-white/80">结构:</span> {suggestion.structure}
                      </div>
                      <div className="text-white/60">
                        <span className="text-white/80">来源:</span> {suggestion.source}
                      </div>
                      {suggestion.elements && (
                        <div className="text-white/60">
                          <span className="text-white/80">五行:</span> {suggestion.elements}
                        </div>
                      )}
                      {suggestion.pronunciation && (
                        <div className="text-white/60">
                          <span className="text-white/80">音韵:</span> {suggestion.pronunciation}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(suggestion.name)}
                      className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      {copiedName === suggestion.name ? <Check size={14} /> : <Copy size={14} />}
                      {copiedName === suggestion.name ? '已复制' : '复制'}
                    </button>
                    <button
                      onClick={() => saveFavoriteName(suggestion)}
                      className="flex-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <Heart size={14} />
                      收藏
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-6">
              <button
                onClick={generateNames}
                className="text-white/70 hover:text-white text-sm transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={16} />
                重新生成
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 使用说明 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-white/60 text-sm space-y-2"
      >
        <p>💡 输入父母双方姓名，系统会智能生成融合双方特色的名字</p>
        <p>🎲 每次生成都会产生不同的组合，多试几次找到最心仪的名字</p>
        <p>💖 点击收藏按钮可以保存喜欢的名字，在成长日记中查看</p>
      </motion.div>
    </div>
  )
}

export default NameGame 