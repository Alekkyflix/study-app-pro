/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ios-blue':      '#007AFF',
        'ios-red':       '#FF3B30',
        'ios-green':     '#34C759',
        'ios-label':     'var(--ios-label)',
        'ios-secondary': 'var(--ios-secondary)',
        'ios-tertiary':  'var(--ios-tertiary)',
        'ios-bg':        'var(--ios-bg)',
        'ios-card':      'var(--ios-card)',
        'ios-separator': 'var(--ios-separator)',
        'ios-pressed':   'var(--ios-pressed)',
        'ios-toggle-off':'var(--ios-toggle-off)',
        'accent-primary': 'var(--accent-primary, #3b82f6)',
      },
      boxShadow: {
        'ios-toggle': '0 2px 4px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
