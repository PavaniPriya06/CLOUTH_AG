/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                cream: {
                    50: '#FEFCF8',
                    100: '#FAF7F0',
                    200: '#F5F0E8',
                    300: '#F0E8D8',
                    400: '#E8DCC8',
                    500: '#D4C4A8',
                },
                beige: '#F5F5DC',
                charcoal: {
                    DEFAULT: '#2C1810',
                    light: '#4A3728',
                    muted: '#6B5B4E',
                },
                gold: {
                    DEFAULT: '#D4A574',
                    light: '#E8C99A',
                    dark: '#B8885C',
                },
                sage: '#8B9D77',
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'Georgia', 'serif'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                'oval': '50%',
                '4xl': '2rem',
                '5xl': '3rem',
            },
            boxShadow: {
                'soft': '0 4px 24px rgba(44, 24, 16, 0.08)',
                'medium': '0 8px 32px rgba(44, 24, 16, 0.12)',
                'strong': '0 16px 48px rgba(44, 24, 16, 0.18)',
                'gold': '0 4px 24px rgba(212, 165, 116, 0.3)',
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
                slideUp: { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
                float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
            },
            backgroundImage: {
                'cream-gradient': 'linear-gradient(135deg, #FAF7F0 0%, #F0E8D8 100%)',
                'charcoal-gradient': 'linear-gradient(135deg, #2C1810 0%, #4A3728 100%)',
                'gold-gradient': 'linear-gradient(135deg, #D4A574 0%, #E8C99A 100%)',
            },
        },
    },
    plugins: [],
}
