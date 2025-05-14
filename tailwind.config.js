/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rokPurple: '#a855f7', // Your primary purple
        rokIvory:  '#f8f8f5', // Your off-white for text
        rokGrayDark: '#111827', // For card backgrounds (Tailwind gray-900)
        rokGrayBorder: '#374151', // For borders (Tailwind gray-700)
        rokGrayInput: '#1f2937',  // For input backgrounds (Tailwind gray-800)
        rokGrayText: '#d1d5db',   // General text (Tailwind gray-300)
        rokGraySubtle: '#9ca3af', // Less important text (Tailwind gray-400)
      },
    },
  },
  plugins: [],
};
