import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { ink: "#17243B", brand: "#6558E8", canvas: "#F6F7FB" } } }, plugins: [] };
export default config;
