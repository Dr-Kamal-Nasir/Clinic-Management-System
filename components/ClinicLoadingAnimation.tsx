// components/ClinicLoadingAnimation.tsx
'use client';
import { motion, Variants } from 'framer-motion';

export default function ClinicLoadingAnimation() {
  // Heartbeat animation
  const heartbeatVariants: Variants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut"
      }
    }
  };

  // Pulse wave animation
  const pulseVariants: Variants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: [1, 1.3, 1],
      opacity: [0.8, 0.4, 0],
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  };

  // DNA strand animation
  const dnaVariants = (i: number): Variants => ({
    animate: {
      y: [0, -10, 0, 10, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        delay: i * 0.1,
        ease: "easeInOut"
      }
    }
  });

  // Medicine capsule animation
  const capsuleVariants: Variants = {
    animate: {
      y: [0, -15, 0],
      rotate: [0, 5, 0, -5, 0],
      transition: {
        y: {
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut"
        },
        rotate: {
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 min-h-[250px] p-6">
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Pulse waves */}
        <motion.div 
          className="absolute inset-0 rounded-full border-2 border-blue-300"
          variants={pulseVariants}
          initial="initial"
          animate="animate"
        />
        <motion.div 
          className="absolute inset-3 rounded-full border-2 border-green-300"
          variants={pulseVariants}
          initial="initial"
          animate="animate"
          style={{ transitionDelay: "0.3s" }}
        />
        
        {/* Heart icon with beat */}
        <motion.div
          className="relative text-red-500"
          variants={heartbeatVariants}
          animate="animate"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            stroke="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </motion.div>
        
        {/* Floating medicine capsules */}
        <motion.div 
          className="absolute -top-2 -right-2"
          variants={capsuleVariants}
          animate="animate"
        >
          <div className="flex items-center">
            <div className="w-6 h-3 bg-blue-500 rounded-l-full"></div>
            <div className="w-3 h-3 bg-blue-300 rounded-r-full"></div>
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute -bottom-2 -left-2"
          variants={capsuleVariants}
          animate="animate"
          style={{ transitionDelay: "0.5s" }}
        >
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-300 rounded-l-full"></div>
            <div className="w-6 h-3 bg-green-500 rounded-r-full"></div>
          </div>
        </motion.div>
      </div>
      
      {/* DNA strand animation */}
      <div className="flex items-center justify-center gap-1">
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center"
            variants={dnaVariants(i)}
            animate="animate"
          >
            <div className="w-1 h-1 bg-purple-500 rounded-full mb-1"></div>
            <div className="w-4 h-0.5 bg-purple-300"></div>
            <div className="w-1 h-1 bg-purple-500 rounded-full mt-1"></div>
          </motion.div>
        ))}
      </div>
      
      {/* Loading text with fade */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h3 
          className="text-lg font-medium text-gray-600"
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          Processing Health Data
        </motion.h3>
        <p className="text-sm text-gray-400 mt-1">
          Securely retrieving patient information
        </p>
      </motion.div>
    </div>
  );
}