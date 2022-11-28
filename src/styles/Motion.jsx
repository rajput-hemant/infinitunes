import { motion } from "framer-motion";

export const Motion = ({ children }) => {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.7 }}
			whileInView={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.5, type: "tween" }}
		>
			{children}
		</motion.div>
	);
};

export const MotionButton = ({ children }) => {
	return (
		<motion.button
			whileHover={{ scale: 1.2 }}
			whileTap={{ scale: 0.8 }}
			transition={{ type: "spring", stiffness: 400, damping: 17 }}
		>
			{children}
		</motion.button>
	);
};
