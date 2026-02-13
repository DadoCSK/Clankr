/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#FD297B',
          coral: '#FF5864',
          orange: '#FF7A3D',
        },
        surface: {
          bg: '#FFFFFF',
          secondary: '#F8F9FC',
          tertiary: '#F1F3F9',
        },
        border: {
          light: '#E8ECF4',
          medium: '#D4DAE7',
        },
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'brand': '0 4px 20px rgba(253, 41, 123, 0.12), 0 2px 8px rgba(255, 88, 100, 0.08)',
        'brand-lg': '0 8px 40px rgba(253, 41, 123, 0.18), 0 4px 16px rgba(255, 88, 100, 0.1)',
        'soft': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};
