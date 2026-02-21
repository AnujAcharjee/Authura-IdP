/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/views/**/*.ejs', './src/**/*.{ts,js}', './public/**/*.{js}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: '#FEF9E1',
          mint: '#D4E2D4',
          peach: '#FFCACC',
          sand: '#E9DAC1',
          teal: '#54BAB9',
          apricot: '#FFD4B2',
          orange: '#FF9644',
          orangeDark: '#FA812F',
          neonGreen: '#16FF00',
          rose: '#F39F9F',
          roseDeep: '#B95E82',
        },
      },
    },
  },
  plugins: [],
};
