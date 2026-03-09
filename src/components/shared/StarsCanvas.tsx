import { motion } from "framer-motion";

export function StarsCanvas() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-zinc-950 to-black"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-30">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            initial={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              opacity: Math.random() 
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}