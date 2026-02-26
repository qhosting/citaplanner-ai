/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gold: {
                    DEFAULT: '#D4AF37',
                    dark: '#8C6F1B',
                },
                luxury: {
                    black: '#050505',
                    card: 'rgba(255, 255, 255, 0.03)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                playfair: ['Playfair Display', 'serif'],
            },
        },
    },
    plugins: [],
}
