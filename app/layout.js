import './globals.css'

export const metadata = {
  title: 'GoodBuddi - Create a Great Day',
  description: 'A calendar platform designed to help people create a great day.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
