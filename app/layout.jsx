
import "./globals.css";
import WhatsAppChat from "./components/WhatsAppChat";

export const metadata = {
  title: "LUBO TRADITIONS | Elegance in Every Tradition",
  description: "Discover timeless traditional fashion at LUBO TRADITIONS.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <WhatsAppChat />
      </body>
    </html>
  );
}
