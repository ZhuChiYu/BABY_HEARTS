import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, Brain, Download, Loader, Trash2, Eye, X } from 'lucide-react'
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

function UltrasoundAnalyzer() {
  const [selectedImage, setSelectedImage] = useState(null) // 显示用的图片URL
  const [selectedFile, setSelectedFile] = useState(null) // 原始文件对象
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [imageModel, setImageModel] = useState('qwen3:32b')
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [showPreview, setShowPreview] = useState(null)
  
  const fileInputRef = useRef(null)

  // 图像理解模型列表
  const imageModels = [
    {
      name: 'qwen3:32b',
      displayName: 'Qwen3 32B',
      description: '高性能多模态模型，强大的视觉理解能力',
      recommended: true
    },
    {
      name: 'gemma3:27b',
      displayName: 'Gemma3 27B',
      description: '大型语言模型，具备图像理解能力',
      recommended: true
    },
    {
      name: 'llava:7b',
      displayName: 'LLaVA 7B',
      description: '专业的图像理解模型',
      recommended: false
    }
  ]

  // 医学分析模型列表
  const medicalModels = [
    {
      name: 'alibayram/medgemma:latest',
      displayName: 'MedGemma',
      description: '专业医学模型，专为医学影像分析优化',
      recommended: true
    },
    {
      name: 'deepseek-r1:70b',
      displayName: 'DeepSeek R1 70B',
      description: '大型推理模型，强大的分析能力',
      recommended: false
    },
    {
      name: 'llama3.2:latest',
      displayName: 'Llama3.2',
      description: '轻量级多模态模型，快速响应',
      recommended: false
    }
  ]

  // 处理图片上传
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file) // 保存原始文件对象
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target.result) // 保存显示用的URL
      }
      reader.readAsDataURL(file)
      setAnalysis(null) // 清除之前的分析结果
    }
  }

  // 图像理解分析
  const analyzeImageContent = async (base64Data) => {
    const prompt = `请详细描述这张B超图像中能观察到的所有医学信息，包括：

1. **图像质量和清晰度**
   - 图像整体质量如何
   - 哪些区域清晰可见，哪些区域模糊

2. **可见的解剖结构**
   - 胎头结构（脑室、颅骨等）
   - 胎体轮廓
   - 四肢情况
   - 脊柱结构
   - 内脏器官（心脏、肺部等）

3. **测量标尺和数据**
   - 图像上是否有测量标尺
   - 可见的测量数据（BPD、HC、AC、FL等）
   - 孕周信息

4. **胎儿姿势和位置**
   - 胎儿在子宫内的位置
   - 胎儿姿势（头位、臀位等）

5. **附属结构**
   - 胎盘位置和形态
   - 羊水情况
   - 脐带结构

6. **图像技术参数**
   - 扫描模式和设置
   - 图像增益和对比度

请用客观、详细的医学描述语言，不要做诊断性判断，只描述能观察到的事实。`

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: prompt,
        images: [base64Data],
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 2000,
          top_p: 0.9,
          timeout: 120
        }
      })
    })

    if (!response.ok) {
      throw new Error(`AI分析失败: ${response.status}`)
    }

    const result = await response.json()
    return filterThinkingContent(result.response) || '分析完成，但未能获取详细结果。'
  }

  // 将文件转换为base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  // 导出分析结果
  const exportAnalysis = (analysisData) => {
    const content = `Baby Beats B超分析报告

分析时间：${analysisData.timestamp}
图像理解模型：${analysisData.imageModel || '未知'}
分析模型：${analysisData.analysisModel || analysisData.model}
分析模式：${analysisData.analysisMode === 'medical' ? '医学分析' : '图像分析'}
可信度：${analysisData.confidence}

${analysisData.imageDescription ? `图像描述：
${analysisData.imageDescription}

` : ''}分析结果：
${analysisData.result}

---
此报告由AI辅助生成，仅供参考，不能替代专业医生诊断。
`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `B超分析报告_${analysisData.timestamp.replace(/[:/\s]/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 删除分析历史
  const deleteHistoryItem = (id) => {
    const updatedHistory = analysisHistory.filter(item => item.id !== id)
    setAnalysisHistory(updatedHistory)
    localStorage.setItem('babyBeats_ultrasound_history', JSON.stringify(updatedHistory))
  }

  // 预览分析结果
  const PreviewModal = ({ item, onClose }) => {
    if (!item) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-white/20 flex justify-between items-center">
            <h3 className="text-white font-semibold text-lg">分析报告预览</h3>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 图像 */}
              <div>
                <img
                  src={item.image}
                  alt="B超图片"
                  className="w-full h-64 object-contain bg-black/20 rounded-lg mb-4"
                />
                <div className="text-sm text-white/70 space-y-1">
                  <p>分析时间: {item.timestamp}</p>
                  <p>图像模型: {item.imageModel || '单阶段'}</p>
                  <p>分析模型: {item.analysisModel || item.model}</p>
                  <p>分析模式: {item.analysisMode === 'medical' ? '医学分析' : '图像分析'}</p>
                </div>
              </div>
              
              {/* 分析结果 */}
              <div>
                <h4 className="text-white font-medium mb-3">分析结果</h4>
                <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="text-white/90 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-base font-bold mb-2 text-white">{children}</h1>,
                        h2: ({children}) => <h2 className="text-sm font-semibold mb-2 text-white">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xs font-medium mb-1 text-white">{children}</h3>,
                        p: ({children}) => <p className="mb-2 text-white/90 text-xs">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-2 text-white/90 text-xs">{children}</ul>,
                        li: ({children}) => <li className="mb-1 text-xs">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                      }}
                    >
                      {item.result}
                    </ReactMarkdown>
                  </div>
                </div>
                
                {item.imageDescription && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">图像描述</h4>
                    <div className="bg-blue-500/10 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <div className="text-white/80 text-xs leading-relaxed prose prose-invert prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h1: ({children}) => <h1 className="text-xs font-bold mb-2 text-white">{children}</h1>, h2: ({children}) => <h2 className="text-xs font-semibold mb-1 text-white">{children}</h2>, h3: ({children}) => <h3 className="text-xs font-medium mb-1 text-white">{children}</h3>, p: ({children}) => <p className="mb-1 text-white/80 text-xs">{children}</p>, ul: ({children}) => <ul className="list-disc list-inside mb-1 text-white/80 text-xs">{children}</ul>, li: ({children}) => <li className="mb-0 text-xs">{children}</li>, strong: ({children}) => <strong className="font-semibold text-white">{children}</strong> }}>{item.imageDescription}</ReactMarkdown></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => exportAnalysis(item)}
                className="bg-green-500/80 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                导出报告
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // 加载分析历史
  React.useEffect(() => {
    const history = JSON.parse(localStorage.getItem('babyBeats_ultrasound_history') || '[]')
    // 对历史记录也应用过滤
    const filteredHistory = history.map(item => {
      if (item.result) {
        item.result = filterThinkingContent(item.result)
      }
      if (item.imageDescription) {
        item.imageDescription = filterThinkingContent(item.imageDescription)
      }
      return item
    })
    setAnalysisHistory(filteredHistory)
    // 更新本地存储
    if (filteredHistory.length > 0) {
      localStorage.setItem('babyBeats_ultrasound_history', JSON.stringify(filteredHistory))
    }
  }, [])

  // 第二阶段：医学专业分析
  const medicalAnalysis = async (imageDescription) => {
    const prompt = `基于以下B超图像的详细描述，请作为专业的医学影像专家，提供综合的医学分析报告：

## 图像描述
${imageDescription}

## 请按以下结构提供专业分析报告：

### 1. 图像质量评估
- 整体图像质量和诊断价值
- 技术参数是否合适
- 是否需要重新扫描

### 2. 解剖结构分析
- 胎儿各系统发育情况
- 可见异常或需要关注的结构
- 测量数据的医学意义

### 3. 孕周评估
- 根据可见测量数据推算孕周
- 胎儿发育是否符合孕周
- 生长发育评估

### 4. 重要发现
- 需要重点关注的医学发现
- 可能的异常或变异
- 胎盘、羊水、脐带情况

### 5. 建议和随访
- 进一步检查建议
- 随访时间安排
- 需要咨询的专科

### 6. 风险评估
- 当前风险等级
- 需要监测的指标
- 预防措施建议

**重要提醒：此分析基于AI图像识别，仅供医学参考，不能替代专业医生的临床诊断。任何医学决策都应咨询专业妇产科医生。**`

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'alibayram/medgemma:latest',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 3000,
          top_p: 0.9,
          timeout: 180
        }
      })
    })

    if (!response.ok) {
      throw new Error(`医学分析失败: ${response.status}`)
    }

    const result = await response.json()
    return filterThinkingContent(result.response) || '医学分析完成，但未能获取详细结果。'
  }

  // 两阶段AI分析
  const analyzeImage = async () => {
    if (!selectedFile) {
      alert('请先上传B超图片')
      return
    }

    setIsAnalyzing(true)
    
    try {
      // 第一阶段：图像理解
      const base64Data = (await convertToBase64(selectedFile)).split(',')[1]
      console.log('第一阶段：开始图像分析...')
      
      const imageDescription = await analyzeImageContent(base64Data)
      console.log('第一阶段完成，开始医学分析...')
      
      // 第二阶段：医学分析
      const medicalReport = await medicalAnalysis(imageDescription)
      console.log('第二阶段完成，AI分析结束')
      
      const analysisResult = {
        id: Date.now().toString(),
        image: selectedImage,
        imageDescription: imageDescription, // 图像描述
        result: medicalReport, // 医学分析报告
        imageModel: imageModel,
        analysisModel: 'alibayram/medgemma:latest',
        timestamp: new Date().toLocaleString('zh-CN'),
        analysisMode: 'two-stage',
        type: 'two-stage'
      }
      
      setAnalysis(analysisResult)
      
      // 保存到历史记录
      const newHistory = [analysisResult, ...analysisHistory.slice(0, 9)] // 保留最近10条
      setAnalysisHistory(newHistory)
      localStorage.setItem('babyBeats_ultrasound_history', JSON.stringify(newHistory))
      
      console.log('两阶段分析结果已保存到历史记录')
      
    } catch (error) {
      console.error('AI分析失败:', error)
      alert('AI分析失败，请稍后重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 标题和说明 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-6 mb-6"
      >
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Brain className="text-purple-300" size={28} />
            AI B超图分析
          </h2>
          <p className="text-white/70">AI智能分析B超图像内容</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <p className="text-yellow-200 text-sm text-center">
            ⚠️ 重要声明：AI分析结果仅供参考，不能替代专业医生的诊断。如有疑问请咨询专业医生。
          </p>
        </div>

        {/* 简化的模型选择 */}
        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-3">AI分析模型</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {imageModels.map(model => (
              <button
                key={model.name}
                onClick={() => setImageModel(model.name)}
                className={`p-3 rounded-lg transition-all text-left ${
                  imageModel === model.name
                    ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                    : 'bg-white/10 border border-white/20 text-white/70 hover:text-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-sm">{model.displayName}</h5>
                    <p className="text-xs opacity-80">{model.description}</p>
                  </div>
                  {model.recommended && (
                    <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">推荐</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 图片上传和分析区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 上传区域 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-effect rounded-2xl p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Upload className="text-blue-300" size={20} />
            上传B超图片
          </h3>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {!selectedImage ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center text-white/70 hover:text-white hover:border-white/50 transition-all"
            >
              <Camera size={48} className="mb-4" />
              <span>点击选择B超图片</span>
              <span className="text-sm mt-2">支持 JPG、PNG 格式</span>
            </button>
          ) : (
            <div className="space-y-4">
              <img
                src={selectedImage}
                alt="B超图片"
                className="w-full h-64 object-contain bg-black/20 rounded-lg"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-blue-500/80 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  重新上传
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="flex-1 bg-purple-500/80 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      AI分析中...
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      开始AI分析
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* 分析结果 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-effect rounded-2xl p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Brain className="text-purple-300" size={20} />
            分析结果
          </h3>

          {!analysis ? (
            <div className="h-48 flex items-center justify-center text-white/50">
              <div className="text-center">
                <Brain size={48} className="mx-auto mb-4 opacity-50" />
                <p>上传B超图片后开始分析</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-white/60 flex justify-between">
                <span>模式：两阶段分析 ({analysis.imageModel} → {analysis.analysisModel})</span>
                <span>{analysis.timestamp}</span>
              </div>
              
              {/* 图像描述 */}
              {analysis.imageDescription && (
                <div className="bg-blue-500/10 rounded-lg p-3">
                  <h4 className="text-white/90 font-medium mb-2 text-sm">第一阶段：图像分析</h4>
                  <div className="text-white/80 text-xs leading-relaxed max-h-32 overflow-y-auto">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-xs font-bold mb-1 text-white">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xs font-semibold mb-1 text-white">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xs font-medium mb-1 text-white">{children}</h3>,
                        p: ({children}) => <p className="mb-1 text-white/80 text-xs">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-1 text-white/80 text-xs">{children}</ul>,
                        li: ({children}) => <li className="mb-0 text-xs">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                      }}
                    >
                      {analysis.imageDescription}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
              {/* 医学分析结果 */}
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white/90 font-medium mb-3 text-sm">第二阶段：医学分析报告</h4>
                <div className="max-h-64 overflow-y-auto">
                  <div className="text-white/90 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-base font-bold mb-3 text-white border-b border-white/20 pb-1">{children}</h1>,
                        h2: ({children}) => <h2 className="text-sm font-semibold mb-2 text-white mt-4">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-medium mb-2 text-white mt-3">{children}</h3>,
                        p: ({children}) => <p className="mb-2 text-white/90 text-sm leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-3 text-white/90 text-sm space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-3 text-white/90 text-sm space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-sm text-white/85">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({children}) => <em className="italic text-white/90">{children}</em>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-purple-400 pl-4 my-3 text-white/80 bg-purple-500/10 py-2 rounded-r">{children}</blockquote>,
                        code: ({children}) => <code className="bg-white/10 px-1 py-0.5 rounded text-sm text-purple-200">{children}</code>,
                      }}
                    >
                      {analysis.result}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => exportAnalysis(analysis)}
                  className="flex-1 bg-green-500/80 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                >
                  <Download size={14} />
                  导出报告
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* 分析历史 */}
      {analysisHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-2xl p-6"
        >
          <h3 className="text-white font-semibold mb-4">📋 分析历史</h3>
          
          <div className="space-y-3">
            {analysisHistory.slice(0, 5).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={item.image}
                    alt="历史B超"
                    className="w-16 h-16 object-cover rounded-lg bg-black/20"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-white font-medium">
                        {item.type === 'two-stage' ? '两阶段分析' : '分析报告'}
                      </span>
                      <span className="text-white/60 text-xs">{item.timestamp}</span>
                    </div>
                    <p className="text-white/80 text-sm line-clamp-2">
                      {item.result.substring(0, 100)}...
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                        {item.imageModel ? `${item.imageModel} → ${item.analysisModel}` : item.model}
                      </span>
                      <button
                        onClick={() => setShowPreview(item)}
                        className="text-xs text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-1"
                      >
                        <Eye size={12} />
                        预览
                      </button>
                      <button
                        onClick={() => exportAnalysis(item)}
                        className="text-xs text-green-300 hover:text-green-200 transition-colors flex items-center gap-1"
                      >
                        <Download size={12} />
                        导出
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="text-xs text-red-300 hover:text-red-200 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 预览模态框 */}
      <AnimatePresence>
        {showPreview && (
          <PreviewModal 
            item={showPreview} 
            onClose={() => setShowPreview(null)} 
          />
        )}
      </AnimatePresence>

      {/* 使用说明 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-center text-white/60 text-sm space-y-2"
      >
        <p>🤖 AI智能分析B超图片，帮您读懂每一次检查结果</p>
        <p>🔒 所有分析完全在您的设备上进行，图片和结果绝不上传到云端</p>
        <p>📱 简单上传，一键分析，让AI成为您的贴心助手</p>
        <p>📊 分析报告支持保存和分享，随时回顾宝宝的成长记录</p>
      </motion.div>
    </div>
  )
}

export default UltrasoundAnalyzer