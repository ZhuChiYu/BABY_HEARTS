import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HeartbeatScene from './components/HeartbeatScene'
import BabyChat from './components/BabyChat'
import GrowthDiary from './components/GrowthDiary'
import CertificateGenerator from './components/CertificateGenerator'
import SleepModePlayer from './components/SleepModePlayer'
import NameGame from './components/NameGame'
import MessageWall from './components/MessageWall'
import UltrasoundAnalyzer from './components/UltrasoundAnalyzer'
import { Heart, MessageCircle, BookOpen, Award, Moon, Gamepad2, MessageSquare, Camera } from 'lucide-react'

function App() {
  const [activeModule, setActiveModule] = useState('heartbeat')
  const [heartbeatData, setHeartbeatData] = useState(null)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const audioRef = useRef(null)

  useEffect(() => {
    // 检查是否是第一次访问
    const hasVisited = localStorage.getItem('babyBeats_hasVisited')
    if (hasVisited) {
      setIsFirstVisit(false)
    } else {
      localStorage.setItem('babyBeats_hasVisited', 'true')
      // 显示儿童节祝福
      setTimeout(() => {
        showChildrensDayMessage()
      }, 2000)
    }
  }, [])

  useEffect(() => {
    // 添加快捷键监听
    const handleKeyDown = (event) => {
      // Ctrl+Shift+C 清除缓存
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        
        const confirmClear = window.confirm(
          '确定要清除所有缓存数据吗？\n这将删除所有保存的AI生成内容、日记条目和分析历史。\n\n此操作不可恢复！'
        )
        
        if (confirmClear) {
          // 清除所有Baby Beats相关的localStorage数据
          const keysToRemove = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('babyBeats_')) {
              keysToRemove.push(key)
            }
          }
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key)
          })
          
          alert(`已清除 ${keysToRemove.length} 个缓存项！页面将在2秒后刷新。`)
          
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const showChildrensDayMessage = () => {
    alert('🎁 宝贝，这是你人生中的第一个儿童节。\n虽然你还藏在妈妈肚子里，但你的心跳已经成为我们最美的旋律。\n你来了，我们的宇宙就亮了。💕')
  }

  const modules = [
    { id: 'heartbeat', name: '心跳宇宙', icon: Heart, component: HeartbeatScene },
    { id: 'chat', name: 'AI宝宝对话', icon: MessageCircle, component: BabyChat },
    { id: 'diary', name: '成长日记', icon: BookOpen, component: GrowthDiary },
    { id: 'certificate', name: '纪念证书', icon: Award, component: CertificateGenerator },
    { id: 'sleep', name: '睡前模式', icon: Moon, component: SleepModePlayer },
    { id: 'name', name: '起名游戏', icon: Gamepad2, component: NameGame },
    { id: 'message', name: '留言墙', icon: MessageSquare, component: MessageWall },
    { id: 'ultrasound', name: 'B超分析', icon: Camera, component: UltrasoundAnalyzer },
  ]

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* 标题栏 */}
      <header className="relative z-50 p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
            Baby Beats
          </h1>
          <p className="text-xl text-pink-200">心跳的礼物 💕</p>
          <p className="text-sm text-white/50 mt-2">
            💡 提示：按 Ctrl+Shift+C 可清除所有缓存数据
          </p>
        </motion.div>
      </header>

      {/* 导航栏 */}
      <nav className="relative z-40 px-4 mb-6">
        <div className="flex flex-wrap justify-center gap-3">
          {modules.map((module) => {
            const IconComponent = module.icon
            return (
              <motion.button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`
                  glass-effect rounded-full px-4 py-2 text-sm font-medium transition-all
                  flex items-center gap-2
                  ${activeModule === module.id 
                    ? 'bg-white/20 text-white heart-glow' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent size={16} />
                {module.name}
              </motion.button>
            )
          })}
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="relative z-30 px-4 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            {ActiveComponent && (
              <ActiveComponent 
                heartbeatData={heartbeatData}
                setHeartbeatData={setHeartbeatData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 儿童节特效背景 */}
      {isFirstVisit && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: window.innerHeight + 100,
                rotate: 0
              }}
              animate={{ 
                y: -100,
                rotate: 360
              }}
              transition={{ 
                duration: Math.random() * 3 + 2,
                delay: Math.random() * 2,
                repeat: Infinity
              }}
            >
              {['🎁', '💕', '👶', '🌟', '💗'][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App 