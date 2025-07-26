'use client';

import { motion, Variants, Transition } from 'framer-motion';
import { FlaskConical, Microscope, Syringe, TestTube2, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnderConstruction() {
  const labEquipment = [
    { icon: <FlaskConical className="h-8 w-8" />, name: 'Flask' },
    { icon: <Microscope className="h-8 w-8" />, name: 'Microscope' },
    { icon: <Syringe className="h-8 w-8" />, name: 'Syringe' },
    { icon: <TestTube2 className="h-8 w-8" />, name: 'Test Tube' },
    { icon: <Pill className="h-8 w-8" />, name: 'Medication' },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      } as Transition,
    },
  };

  const labEquipmentVariants: Variants = {
    hover: {
      y: -10,
      rotate: [0, -5, 5, 0],
      transition: {
        y: { repeat: Infinity, repeatType: 'reverse', duration: 1.5 },
        rotate: { duration: 0.8 },
      } as Transition,
    },
  };

  const bubbleAnimation = {
    y: [0, -20, 0] as [number, number, number],
    opacity: [0.6, 1, 0.6] as [number, number, number],
    transition: {
      y: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut' as const,
      },
      opacity: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-2xl w-full text-center"
      >
        <motion.div variants={itemVariants}>
          <div className="relative inline-block">
            <motion.div
              animate={{
                y: [0, -5, 0] as [number, number, number],
                transition: { 
                  repeat: Infinity, 
                  duration: 3, 
                  ease: 'easeInOut' as const 
                },
              }}
              className="absolute -top-6 -left-6 text-blue-500"
            >
              <FlaskConical className="h-12 w-12" />
            </motion.div>
            <h1 className="text-5xl font-bold text-blue-900 relative z-10">
              Lab Under Construction
            </h1>
          </div>
        </motion.div>

        <motion.p variants={itemVariants} className="mt-6 text-lg text-blue-800">
          Our medical laboratory is being upgraded with cutting-edge technology
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-8 flex justify-center gap-6 flex-wrap"
        >
          {labEquipment.map((equipment, index) => (
            <motion.div
              key={index}
              variants={labEquipmentVariants}
              whileHover="hover"
              className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center border border-blue-100"
            >
              <div className="text-blue-600">{equipment.icon}</div>
              <span className="mt-2 text-sm font-medium text-blue-900">
                {equipment.name}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-12 relative h-40 w-full"
        >
          {/* Animated test tube bubbles */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-32 bg-blue-100 rounded-b-lg border-t-2 border-blue-200 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  ...bubbleAnimation,
                  transition: {
                    ...bubbleAnimation.transition,
                    y: {
                      ...bubbleAnimation.transition.y,
                      duration: 3 + i * 0.5,
                    },
                    opacity: {
                      ...bubbleAnimation.transition.opacity,
                      duration: 3 + i * 0.5,
                    },
                  },
                }}
                className="absolute w-4 h-4 bg-blue-400 rounded-full"
                style={{
                  left: `${10 + i * 15}px`,
                  bottom: '10px',
                }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-16">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            Get Notified When Ready
          </Button>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="mt-8 text-sm text-blue-700"
        >
          We&apos;ll be back with enhanced diagnostic capabilities soon!
        </motion.p>
      </motion.div>
    </div>
  );
}
