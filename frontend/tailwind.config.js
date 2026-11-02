/** @type {import('tailwindcss').Config} */
// Colour tokens are taken directly from the Figma file (Truland Homes | Contractor Quotations).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: { DEFAULT: '#f52232', bright: '#ff0016', dark: '#bc0100' },
        chrome: { DEFAULT: '#374149', line: '#4a555d', text: '#e5e9ec', muted: '#dbe0e3' },
        page: '#f1f4f6',
        ink: { DEFAULT: '#313b43', soft: '#303943', body: '#424c54', label: '#56616a', sub: '#626d76' },
        muted: { DEFAULT: '#89939b', nav: '#727d85', light: '#9099a0', grey: '#808080' },
        line: { DEFAULT: '#e5e9ec', soft: '#edf0f2', input: '#dce1e5', field: '#cbcfd0', side: '#e3e7ea' },
        surface: { head: '#e9ecee', subtle: '#fafbfc', panel: '#f8f9fa' },
        filter: '#606262',
      },
      boxShadow: {
        drawer: '-8px 0 30px 0 rgba(0,0,0,0.18)',
        menu: '0 4px 14px 0 rgba(0,0,0,0.15)',
        tab: '0 1px 2px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
