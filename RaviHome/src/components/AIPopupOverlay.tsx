import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { IonIcon } from '@ionic/react';
import {
  checkmarkCircle,
  closeCircle,
  alertCircle,
  informationCircle,
  trainOutline,
  busOutline,
  walletOutline,
  flashOutline,
  trophyOutline,
  cardOutline,
  archiveOutline,
  sunnyOutline,
  moonOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

const AIPopupOverlay: React.FC = () => {
  const { notification, animation, clearNotification, clearAnimation } = useNotificationStore();
  const [coins, setCoins] = useState<{ id: number; left: number; delay: number }[]>([]);

  // Auto-clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, notification.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  // Auto-clear animation
  useEffect(() => {
    if (animation) {
      if (animation === 'DEPOSIT') {
        // Generate coin rain coordinates
        const generated = Array.from({ length: 45 }).map((_, i) => ({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 1.5,
        }));
        setCoins(generated);
      }
      const duration = animation === 'THEME' ? 1800 : 3500;
      const timer = setTimeout(() => {
        clearAnimation();
        setCoins([]);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [animation, clearAnimation]);

  const getNotificationStyles = () => {
    switch (notification?.type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/95 border-emerald-400 text-white shadow-emerald-500/20',
          icon: checkmarkCircle,
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
        };
      case 'failure':
        return {
          bg: 'bg-red-500/95 border-red-400 text-white shadow-red-500/20',
          icon: closeCircle,
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
        };
      case 'validation':
        return {
          bg: 'bg-amber-500/95 border-amber-400 text-white shadow-amber-500/20',
          icon: alertCircle,
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-600/95 border-blue-400 text-white shadow-blue-500/20',
          icon: informationCircle,
          glow: 'shadow-[0_0_20px_rgba(37,99,235,0.4)]',
        };
    }
  };

  const currentStyles = getNotificationStyles();

  return (
    <>
      {/* 1. Dynamic Alert Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`fixed top-0 left-0 right-0 mx-auto max-w-sm z-[10000] px-4 pointer-events-auto`}
          >
            <div
              className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md ${currentStyles.bg} ${currentStyles.glow} cursor-pointer`}
              onClick={clearNotification}
            >
              <IonIcon icon={currentStyles.icon} className="text-2xl mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-extrabold text-sm tracking-wide uppercase opacity-90">{notification.title}</h4>
                <p className="text-sm mt-0.5 leading-relaxed font-medium text-white/95">{notification.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Premium Fullscreen Custom Animations Overlay */}
      <AnimatePresence>
        {animation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/40 backdrop-blur-sm pointer-events-none"
          >
            {/* TRAIN ANIMATION */}
            {animation === 'TRAIN' && (
              <div className="relative w-full h-full flex flex-col justify-end pb-32">
                {/* Landscape Details */}
                <div className="absolute inset-x-0 bottom-24 h-48 border-b-8 border-slate-700 bg-slate-200/5 flex items-end overflow-hidden">
                  {/* Railway Tracks */}
                  <div className="w-full flex gap-1 border-t-2 border-slate-600">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="w-2 h-4 bg-amber-800/80 -mt-1 mx-auto rotate-12" />
                    ))}
                  </div>
                </div>

                {/* Train running from left to right */}
                <motion.div
                  initial={{ x: '-150vw' }}
                  animate={{ x: '150vw' }}
                  transition={{ duration: 4.5, ease: 'linear' }}
                  className="z-10 h-32 flex items-end"
                >
                  <img
                    src="/assets/real_train.png"
                    alt="Real Train"
                    className="h-28 object-contain drop-shadow-2xl"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </motion.div>

                {/* Confirm banner */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="absolute inset-0 m-auto w-64 h-32 bg-white/95 border-2 border-blue-500 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-4"
                >
                  <IonIcon icon={checkmarkCircleOutline} className="text-5xl text-blue-500 mb-1" />
                  <h3 className="text-lg font-extrabold text-slate-800">Train Booking Success</h3>
                  <p className="text-xs font-semibold text-slate-500">Boarding Confirmed!</p>
                </motion.div>
              </div>
            )}

            {/* BUS ANIMATION */}
            {animation === 'BUS' && (
              <div className="relative w-full h-full flex flex-col justify-end pb-32">
                <div className="absolute inset-x-0 bottom-24 h-16 bg-slate-800 border-t-4 border-slate-700 shadow-inner flex items-center">
                  <div className="w-full border-t-2 border-dashed border-yellow-400" />
                </div>

                {/* Bus running from right to left / left to right (let's do left to right) */}
                <motion.div
                  initial={{ x: '-120vw' }}
                  animate={{ x: '120vw' }}
                  transition={{ duration: 3.2, ease: 'linear' }}
                  className="flex flex-col items-start z-10"
                >
                  <div className="bg-orange-500 border-b-8 border-orange-700 w-36 h-20 rounded-t-2xl rounded-r-3xl shadow-lg relative p-2 flex flex-col justify-between">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 bg-slate-900/60 rounded border border-orange-300" />
                      <div className="w-6 h-6 bg-slate-900/60 rounded border border-orange-300" />
                      <div className="w-6 h-6 bg-slate-900/60 rounded border border-orange-300" />
                    </div>
                    <div className="flex justify-between items-center text-white px-2">
                      <span className="font-bold text-xs uppercase">Express</span>
                      <IonIcon icon={busOutline} className="text-4xl" />
                    </div>
                  </div>
                  {/* Rotating Wheels */}
                  <div className="flex justify-around w-36 px-4 -mt-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.4, ease: 'linear' }} className="w-6 h-6 rounded-full bg-slate-900 border-4 border-slate-400" />
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.4, ease: 'linear' }} className="w-6 h-6 rounded-full bg-slate-900 border-4 border-slate-400" />
                  </div>
                </motion.div>

                {/* Success Banner */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="absolute inset-0 m-auto w-64 h-32 bg-white/95 border-2 border-orange-500 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-4"
                >
                  <IonIcon icon={checkmarkCircleOutline} className="text-5xl text-orange-500 mb-1" />
                  <h3 className="text-lg font-extrabold text-slate-800">Bus Ticket Reserved</h3>
                  <p className="text-xs font-semibold text-slate-500">Seat Confirmed!</p>
                </motion.div>
              </div>
            )}

            {/* DEPOSIT SUCCESS ANIMATION */}
            {animation === 'DEPOSIT' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-emerald-950/30">
                {/* Vault Door opening */}
                <motion.div
                  initial={{ scale: 0.6, rotate: 0 }}
                  animate={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.8, type: 'spring' }}
                  className="w-48 h-48 rounded-full bg-amber-500 border-8 border-amber-600 shadow-2xl flex items-center justify-center relative z-20"
                >
                  <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: [1, 0, 1] }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="w-36 h-36 rounded-full bg-amber-600 border-4 border-dashed border-amber-800 flex items-center justify-center"
                  >
                    <IonIcon icon={walletOutline} className="text-white text-7xl" />
                  </motion.div>
                </motion.div>

                {/* Coin Rain */}
                <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
                  {coins.map((coin) => (
                    <motion.div
                      key={coin.id}
                      initial={{ y: -50, x: `${coin.left}vw`, rotate: 0, opacity: 0.9 }}
                      animate={{ y: '105vh', rotate: 360, opacity: 0.6 }}
                      transition={{
                        duration: 1.6,
                        delay: coin.delay,
                        ease: 'linear',
                        repeat: 1,
                      }}
                      className="absolute w-6 h-6 rounded-full bg-yellow-400 border border-yellow-600 flex items-center justify-center text-[10px] font-bold text-yellow-800 shadow"
                    >
                      ₹
                    </motion.div>
                  ))}
                </div>

                {/* Status text */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="mt-8 text-center text-white z-20"
                >
                  <h2 className="text-3xl font-extrabold text-yellow-400 drop-shadow-md">Deposit Logged!</h2>
                  <p className="text-sm font-semibold opacity-90 mt-1">Growth & Compound Interest Awaiting</p>
                </motion.div>
              </div>
            )}

            {/* ELECTRICITY Sparks ANIMATION */}
            {animation === 'EB' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-blue-950/20">
                {/* Lightbulb glowing */}
                <motion.div
                  initial={{ scale: 0.4 }}
                  animate={{ scale: [0.4, 1.2, 1] }}
                  transition={{ duration: 0.6, type: 'spring' }}
                  className="relative z-10"
                >
                  <div className="w-36 h-36 rounded-full bg-yellow-400/90 shadow-[0_0_80px_rgba(250,204,21,0.8)] border-4 border-yellow-300 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                      <IonIcon icon={flashOutline} className="text-yellow-900 text-8xl" />
                    </motion.div>
                  </div>
                  {/* Energy Arcs */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 2.5],
                        opacity: [0.8, 0],
                        rotate: i * 60,
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.9,
                        delay: i * 0.15,
                      }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-12 border-t-2 border-yellow-400"
                    />
                  ))}
                </motion.div>

                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 text-center text-white z-20"
                >
                  <h2 className="text-2xl font-black text-yellow-300 drop-shadow-md">EB Reading Saved</h2>
                  <p className="text-sm font-semibold opacity-90 mt-1">Utility Expense Synced</p>
                </motion.div>
              </div>
            )}

            {/* PLANNED TASK ANIMATION */}
            {animation === 'PLANNED_TASK' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-indigo-950/20">
                <motion.div
                  initial={{ y: -300, rotate: -10 }}
                  animate={{ y: 0, rotate: 0 }}
                  exit={{ y: 300, opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="w-64 h-80 bg-white border border-indigo-200 rounded-3xl shadow-2xl p-6 relative flex flex-col"
                >
                  {/* Clipboard Header */}
                  <div className="absolute top-0 inset-x-0 mx-auto -translate-y-1/2 w-28 h-6 bg-slate-400 rounded-t-xl shadow" />
                  <div className="flex-1 space-y-4 mt-4">
                    <div className="h-6 w-3/4 bg-slate-200 rounded" />
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded border-2 border-slate-300" />
                      <div className="h-4 w-1/2 bg-slate-100 rounded" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded border-2 border-slate-300" />
                      <div className="h-4 w-2/3 bg-slate-100 rounded" />
                    </div>
                    {/* Pencil animation checking */}
                    <div className="flex items-center gap-3 relative">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="w-6 h-6 rounded border-2 border-emerald-500 flex items-center justify-center text-emerald-500 font-bold"
                      >
                        ✓
                      </motion.div>
                      <div className="h-4 w-1/2 bg-slate-100 rounded" />

                      {/* Pencil drawing */}
                      <motion.div
                        initial={{ x: 60, y: -40 }}
                        animate={{ x: [60, 10, 20], y: [-40, 0, -20] }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="absolute left-6 w-4 h-16 bg-amber-400 border border-amber-600 rounded-t rotate-45 origin-bottom"
                      >
                        <div className="w-4 h-4 bg-slate-900 border-b-4 border-amber-900" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
                      </motion.div>
                    </div>
                  </div>
                  <h4 className="text-center font-extrabold text-indigo-700 mt-auto text-sm">Task Scheduled</h4>
                </motion.div>
              </div>
            )}

            {/* COMPLETED TASK ANIMATION */}
            {animation === 'COMPLETED_TASK' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-violet-950/20">
                {/* Trophy spinning in */}
                <motion.div
                  initial={{ scale: 0.3, rotateY: 0 }}
                  animate={{ scale: [0.3, 1.2, 1], rotateY: 720 }}
                  transition={{ duration: 1, type: 'spring' }}
                  className="w-44 h-44 rounded-full bg-violet-600 border-4 border-violet-400 shadow-2xl flex items-center justify-center"
                >
                  <IonIcon icon={trophyOutline} className="text-yellow-300 text-8xl" />
                </motion.div>

                {/* Confetti bursting */}
                {Array.from({ length: 40 }).map((_, i) => {
                  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                  return (
                    <motion.div
                      key={i}
                      initial={{
                        x: 0,
                        y: 0,
                        scale: Math.random() * 0.5 + 0.5,
                        opacity: 1,
                      }}
                      animate={{
                        x: (Math.random() - 0.5) * 600,
                        y: (Math.random() - 0.7) * 500,
                        rotate: Math.random() * 720,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 1.5,
                        ease: 'easeOut',
                      }}
                      className="absolute w-3 h-3 rounded-sm pointer-events-none"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                  );
                })}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 text-center text-white"
                >
                  <h2 className="text-3xl font-black text-violet-300">Goal Accomplished!</h2>
                  <p className="text-sm font-semibold opacity-90 mt-1">Audit Log updated. Task Complete.</p>
                </motion.div>
              </div>
            )}

            {/* PAYMENT DEBIT CARD SWIPE */}
            {animation === 'PAYMENT_DEBIT' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-rose-950/20">
                <div className="relative w-72 h-80 flex flex-col items-center">
                  {/* Card Swiper POS Machine */}
                  <div className="w-56 h-60 bg-slate-800 rounded-2xl border-4 border-slate-900 shadow-2xl p-4 flex flex-col justify-between relative z-10">
                    <div className="w-full h-8 bg-slate-950 rounded flex items-center justify-end px-2">
                      <span className="text-[10px] text-green-400 font-mono">Approved</span>
                    </div>
                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-4 bg-slate-700 rounded-sm" />
                      ))}
                    </div>
                    {/* Swiper Slot */}
                    <div className="absolute right-0 top-12 bottom-12 w-2 bg-slate-900 border-l-2 border-slate-950" />
                  </div>

                  {/* Credit Card swiping down */}
                  <motion.div
                    initial={{ y: -180, x: 26, rotate: 90 }}
                    animate={{ y: 200 }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                    className="absolute z-20 w-44 h-28 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl border border-rose-400 shadow-lg p-3 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-6 bg-yellow-300/80 rounded" />
                      <IonIcon icon={cardOutline} className="text-white text-2xl" />
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-white/40 rounded" />
                      <div className="w-2/3 h-2 bg-white/40 rounded" />
                    </div>
                  </motion.div>

                  {/* Printed Receipt coming out of POS */}
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 120, opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.8 }}
                    className="absolute top-44 w-32 bg-white border-x border-b border-slate-300 shadow flex flex-col items-center p-2 overflow-hidden z-0"
                  >
                    <div className="w-full border-t border-dashed border-slate-400 my-1" />
                    <div className="w-4/5 h-2 bg-slate-200 rounded my-0.5" />
                    <div className="w-3/4 h-2 bg-slate-200 rounded my-0.5" />
                    <div className="w-2/3 h-2 bg-slate-200 rounded my-0.5" />
                    <div className="w-full border-t border-dashed border-slate-400 my-1" />
                    <span className="text-[8px] font-bold text-slate-500 font-mono">Rs. DEBIT SYNC</span>
                  </motion.div>
                </div>
              </div>
            )}

            {/* PAYMENT CREDIT MONEY RAIN */}
            {animation === 'PAYMENT_CREDIT' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-emerald-950/20">
                {/* Money bag popup */}
                <motion.div
                  initial={{ scale: 0.2 }}
                  animate={{ scale: [0.2, 1.2, 1] }}
                  transition={{ duration: 0.6, type: 'spring' }}
                  className="w-36 h-36 rounded-full bg-emerald-600 border-4 border-emerald-400 shadow-2xl flex items-center justify-center z-20"
                >
                  <span className="text-white text-6xl font-bold">₹</span>
                </motion.div>

                {/* Flying dollar notes */}
                {Array.from({ length: 25 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: Math.random() * window.innerWidth - window.innerWidth / 2,
                      y: window.innerHeight + 100,
                      rotate: 0,
                    }}
                    animate={{
                      y: -150,
                      x: (Math.random() - 0.5) * window.innerWidth,
                      rotate: Math.random() * 360,
                    }}
                    transition={{
                      duration: 2.2,
                      delay: Math.random() * 1.5,
                      ease: 'easeOut',
                    }}
                    className="absolute w-12 h-6 bg-emerald-100 border border-emerald-500 rounded flex items-center justify-center text-[10px] font-bold text-emerald-800 shadow z-10 pointer-events-none"
                  >
                    ₹ ₹
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 text-center text-white z-20"
                >
                  <h2 className="text-3xl font-extrabold text-emerald-400">Income Logged!</h2>
                  <p className="text-sm font-semibold opacity-90 mt-1">Available balance increased</p>
                </motion.div>
              </div>
            )}

            {/* THEME TOGGLE ANIMATION */}
            {animation === 'THEME' && (
              <div className="relative w-full h-full flex items-center justify-center bg-slate-900/10">
                <motion.div
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: [0, 1.3, 1], rotate: 360 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 1.2, type: 'spring' }}
                  className="w-40 h-40 rounded-full bg-slate-900/90 border-4 border-slate-800 shadow-2xl flex items-center justify-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex items-center justify-center text-yellow-400"
                  >
                    <IonIcon icon={sunnyOutline} className="text-6xl absolute transition-opacity" />
                    <IonIcon icon={moonOutline} className="text-6xl text-blue-300" />
                  </motion.div>
                </motion.div>
              </div>
            )}

            {/* ARCHIVE / LOG ZIP ANIMATION */}
            {animation === 'ARCHIVE' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-teal-950/20">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="w-56 h-56 bg-teal-900/90 border border-teal-500 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-6 text-white relative"
                >
                  <IonIcon icon={archiveOutline} className="text-7xl text-teal-300 mb-2" />
                  {/* Zip lines */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    transition={{ duration: 1.5 }}
                    className="h-1 bg-gradient-to-r from-teal-400 via-yellow-400 to-teal-400 my-2"
                  />
                  <h3 className="text-lg font-bold">Zipping Database Logs</h3>
                  <span className="text-[10px] text-teal-300 animate-pulse font-mono">sqlite_backup.zip</span>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIPopupOverlay;
