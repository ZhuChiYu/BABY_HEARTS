import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Award, Heart, Calendar } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

function CertificateGenerator({ heartbeatData }) {
  const [certificateData, setCertificateData] = useState({
    babyName: '小宝贝',
    parentNames: '爸爸 & 妈妈',
    pregnancyWeek: '19周3天',
    heartRate: '150',
    message: '你是我们生命中最美的奇迹，每一次心跳都在诉说着爱的力量。',
    date: new Date().toLocaleDateString('zh-CN')
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const certificateRef = useRef(null)

  // 生成心跳波形SVG
  const generateHeartbeatWave = () => {
    const points = []
    const width = 300
    const height = 60
    const baseY = height / 2

    // 生成心跳波形数据
    for (let x = 0; x < width; x += 5) {
      let y = baseY
      
      // 心跳模式
      const cycle = (x % 80) / 80
      if (cycle < 0.1) {
        y = baseY - 20 // 主峰
      } else if (cycle < 0.15) {
        y = baseY + 10 // 下降
      } else if (cycle < 0.2) {
        y = baseY - 10 // 小峰
      } else {
        y = baseY + Math.sin(x * 0.1) * 3 // 基线波动
      }
      
      points.push(`${x},${y}`)
    }

    return (
      <svg width={width} height={height} className="mx-auto">
        <polyline
          fill="none"
          stroke="#ff69b4"
          strokeWidth="2"
          points={points.join(' ')}
        />
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <polyline
          fill="none"
          stroke="#ff69b4"
          strokeWidth="2"
          points={points.join(' ')}
          filter="url(#glow)"
          opacity="0.7"
        />
      </svg>
    )
  }

  // 导出为图片
  const exportAsImage = async () => {
    if (!certificateRef.current) return

    setIsGenerating(true)
    try {
      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        logging: false,
        useCORS: true
      })

      const link = document.createElement('a')
      link.download = `宝宝心跳证书_${certificateData.date}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('导出图片失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 导出为PDF
  const exportAsPDF = async () => {
    if (!certificateRef.current) return

    setIsGenerating(true)
    try {
      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        logging: false,
        useCORS: true
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight
      )
      
      pdf.save(`宝宝心跳证书_${certificateData.date}.pdf`)
    } catch (error) {
      console.error('导出PDF失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInputChange = (field, value) => {
    setCertificateData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 编辑面板 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-6 mb-6"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Award className="text-yellow-300" size={28} />
            纪念证书生成器
          </h2>
          <p className="text-white/70">为宝宝创建独一无二的心跳纪念证书</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-3">📝 证书信息</h3>
            
            <div>
              <label className="block text-white/70 text-sm mb-2">宝宝称呼</label>
              <input
                type="text"
                value={certificateData.babyName}
                onChange={(e) => handleInputChange('babyName', e.target.value)}
                className="w-full bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-white/40 focus:outline-none"
                placeholder="小宝贝"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">父母称呼</label>
              <input
                type="text"
                value={certificateData.parentNames}
                onChange={(e) => handleInputChange('parentNames', e.target.value)}
                className="w-full bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-white/40 focus:outline-none"
                placeholder="爸爸 & 妈妈"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/70 text-sm mb-2">孕周</label>
                <input
                  type="text"
                  value={certificateData.pregnancyWeek}
                  onChange={(e) => handleInputChange('pregnancyWeek', e.target.value)}
                  className="w-full bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-white/40 focus:outline-none"
                  placeholder="19周3天"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">心率 (BPM)</label>
                <input
                  type="text"
                  value={certificateData.heartRate}
                  onChange={(e) => handleInputChange('heartRate', e.target.value)}
                  className="w-full bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-white/40 focus:outline-none"
                  placeholder="150"
                />
              </div>
            </div>
          </div>

          {/* 个人寄语 */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold mb-3">💕 给宝宝的话</h3>
            
            <textarea
              value={certificateData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={6}
              className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-3 border border-white/20 focus:border-white/40 focus:outline-none"
              placeholder="写下想对宝宝说的话..."
            />

            <div>
              <label className="block text-white/70 text-sm mb-2">证书日期</label>
              <input
                type="date"
                value={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('date', new Date(e.target.value).toLocaleDateString('zh-CN'))}
                className="w-full bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 focus:border-white/40 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 导出按钮 */}
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={exportAsImage}
            disabled={isGenerating}
            className="bg-blue-500/80 hover:bg-blue-500 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Download size={18} />
            导出图片
          </button>
          <button
            onClick={exportAsPDF}
            disabled={isGenerating}
            className="bg-red-500/80 hover:bg-red-500 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Download size={18} />
            导出PDF
          </button>
        </div>

        {isGenerating && (
          <div className="text-center mt-4">
            <span className="text-white/70 text-sm animate-pulse">正在生成证书...</span>
          </div>
        )}
      </motion.div>

      {/* 证书预览 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center"
      >
        <div
          ref={certificateRef}
          className="w-[800px] h-[600px] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(255, 105, 180, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(135, 206, 235, 0.1) 0%, transparent 50%),
              linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)
            `
          }}
        >
          {/* 装饰性星星 */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-white/20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 10 + 8}px`
              }}
            >
              ✨
            </div>
          ))}

          {/* 证书内容 */}
          <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-16">
            {/* 标题 */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-white mb-3 tracking-wide">
                Baby Beats
              </h1>
              <h2 className="text-2xl text-pink-200 font-medium">心跳纪念证书</h2>
              <div className="w-32 h-1 bg-gradient-to-r from-pink-400 to-blue-400 mx-auto mt-4 rounded-full"></div>
            </div>

            {/* 主要信息 */}
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-center gap-3 text-3xl font-bold text-white">
                <Heart className="text-pink-400 animate-heartbeat" size={32} />
                <span>{certificateData.babyName}</span>
                <Heart className="text-pink-400 animate-heartbeat" size={32} />
              </div>
              
              <p className="text-xl text-white/90">
                来自 <span className="text-pink-300 font-semibold">{certificateData.parentNames}</span> 的爱
              </p>
              
              <div className="flex items-center justify-center gap-8 text-lg text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-blue-300" />
                  <span>{certificateData.pregnancyWeek}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={20} className="text-red-300" />
                  <span>{certificateData.heartRate} BPM</span>
                </div>
              </div>
            </div>

            {/* 心跳波形 */}
            <div className="mb-8">
              {generateHeartbeatWave()}
            </div>

            {/* 寄语 */}
            <div className="mb-8 max-w-md">
              <p className="text-lg text-white/90 leading-relaxed italic">
                "{certificateData.message}"
              </p>
            </div>

            {/* 底部信息 */}
            <div className="space-y-2 text-white/70">
              <p className="text-sm">记录于 {certificateData.date}</p>
              <p className="text-xs">生命的第一份礼物 · 永恒的爱</p>
            </div>

            {/* 装饰性边框 */}
            <div className="absolute inset-4 border-2 border-white/10 rounded-2xl pointer-events-none"></div>
            <div className="absolute inset-8 border border-white/5 rounded-xl pointer-events-none"></div>
          </div>
        </div>
      </motion.div>

      {/* 使用说明 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-center text-white/60 text-sm space-y-2"
      >
        <p>💡 填写信息后，点击导出按钮保存证书</p>
        <p>🖼️ 推荐导出为PDF格式，方便打印收藏</p>
        <p>💕 这份证书将成为宝宝珍贵的成长纪念</p>
      </motion.div>
    </div>
  )
}

export default CertificateGenerator 