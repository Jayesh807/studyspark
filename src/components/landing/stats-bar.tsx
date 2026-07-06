// "use client";

// import { motion } from "framer-motion";
// import { Users, CheckCircle2, Activity, Star } from "lucide-react";
// import { AnimatedCounter } from "@/components/shared/animated-counter";

// interface Stat {
//   icon: React.ComponentType<{ className?: string }>;
//   value: number;
//   suffix?: string;
//   decimals?: number;
//   label: string;
//   tone: string;
// }

// const STATS: Stat[] = [
//   {
//     icon: Users,
//     value: 10000,
//     suffix: "+",
//     label: "Students",
//     tone: "from-violet-500 to-purple-500",
//   },
//   {
//     icon: CheckCircle2,
//     value: 500000,
//     suffix: "+",
//     label: "Tasks completed",
//     tone: "from-fuchsia-500 to-pink-500",
//   },
//   {
//     icon: Activity,
//     value: 99.9,
//     decimals: 1,
//     suffix: "%",
//     label: "Uptime",
//     tone: "from-emerald-500 to-teal-500",
//   },
//   {
//     icon: Star,
//     value: 4.9,
//     decimals: 1,
//     suffix: "/5",
//     label: "Avg. rating",
//     tone: "from-amber-500 to-orange-500",
//   },
// ];

// export function StatsBar() {
//   return (
//     <section className="relative px-4 py-12 sm:py-16" aria-label="Stats">
//       <div className="mx-auto max-w-6xl">
//         <div className="glass grid grid-cols-2 gap-px overflow-hidden rounded-3xl lg:grid-cols-4">
//           {STATS.map((stat, i) => (
//             <motion.div
//               key={stat.label}
//               initial={{ opacity: 0, y: 18 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true, margin: "-60px" }}
//               transition={{
//                 duration: 0.5,
//                 ease: [0.22, 1, 0.36, 1],
//                 delay: i * 0.08,
//               }}
//               className="group relative flex flex-col items-center gap-2 p-6 text-center sm:p-8"
//             >
//               <div
//                 className={`mb-1 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.tone} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
//               >
//                 <stat.icon className="size-5" />
//               </div>
//               <div className="text-3xl font-bold tracking-tight sm:text-4xl">
//                 <AnimatedCounter
//                   value={stat.value}
//                   decimals={stat.decimals ?? 0}
//                   suffix={stat.suffix ?? ""}
//                 />
//               </div>
//               <p className="text-sm font-medium text-muted-foreground">
//                 {stat.label}
//               </p>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }
