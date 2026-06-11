import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import { ReactNode, useRef } from "react";

/**
 * Contenedor con efecto 3D interactivo: la tarjeta se inclina siguiendo el
 * puntero (perspectiva + rotateX/rotateY con resorte) y un brillo especular
 * recorre la superficie. Los hijos pueden usar translateZ para profundidad
 * real gracias a transform-style: preserve-3d.
 */
export default function Tilt3D({
  children,
  className = "",
  maxTilt = 9,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Posición normalizada del puntero dentro de la tarjeta (-0.5 .. 0.5)
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [maxTilt, -maxTilt]), {
    stiffness: 160,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-maxTilt, maxTilt]), {
    stiffness: 160,
    damping: 18,
  });
  const glareX = useTransform(px, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(py, [-0.5, 0.5], ["20%", "80%"]);
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) =>
      `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 30%, transparent 60%)`
  );

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div className={className} style={{ perspective: 1300 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative will-change-transform"
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-3xl pointer-events-none z-20"
            style={{ background: glareBackground }}
          />
        )}
      </motion.div>
    </div>
  );
}
