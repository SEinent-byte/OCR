import { motion, useMotionValue, useSpring } from "framer-motion";
import { useMemo } from "react";

export function ParallaxCard({ children, className = "", onHoverStart, onClick }) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 180, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 180, damping: 20 });

  const handlers = useMemo(
    () => ({
      onMouseMove: (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        rotateX.set((mouseY - centerY) / 15);
        rotateY.set((mouseX - centerX) / 15);
      },
      onMouseLeave: () => {
        rotateX.set(0);
        rotateY.set(0);
      },
    }),
    [rotateX, rotateY]
  );

  return (
    <motion.div
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 1000 }}
      className={className}
      onMouseMove={handlers.onMouseMove}
      onMouseLeave={handlers.onMouseLeave}
      onMouseEnter={onHoverStart}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
