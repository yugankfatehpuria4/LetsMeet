import { Orbitron, Exo_2 } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "./components/error-boundary";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata = {
  title: {
    default: "LetsMeet — AI Meeting Assistant",
    template: "%s | LetsMeet",
  },
  description: "Smart meetings with live transcription, AI summaries, and action items. Experience the future of collaborative communication with real-time AI assistance.",
  keywords: ["meeting", "AI", "transcription", "collaboration", "productivity", "video call"],
  authors: [{ name: "LetsMeet Team" }],
  creator: "LetsMeet",
  publisher: "LetsMeet",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://letsmeet.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://letsmeet.ai',
    title: 'LetsMeet — AI Meeting Assistant',
    description: 'Smart meetings with live transcription, AI summaries, and action items.',
    siteName: 'LetsMeet',
    images: [
      {
        url: '/favicon.ico',
        width: 48,
        height: 48,
        alt: 'LetsMeet - AI Meeting Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LetsMeet — AI Meeting Assistant',
    description: 'Smart meetings with live transcription, AI summaries, and action items.',
    images: ['/favicon.ico'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00f5ff' },
    { media: '(prefers-color-scheme: dark)', color: '#00f5ff' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${exo2.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00f5ff" />
        <meta name="msapplication-TileColor" content="#00f5ff" />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[PWA] ServiceWorker registered:', registration.scope);
                    })
                    .catch(function(error) {
                      console.error('[PWA] ServiceWorker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
