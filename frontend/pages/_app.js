import '../styles/globals.css';
import HeaderNav from '../components/HeaderNav';

export default function App({ Component, pageProps }) {
  return (
    <div>
      <HeaderNav />
      <main className="container py-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}