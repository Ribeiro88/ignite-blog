import Link from 'next/link';
import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/">
        <a className={styles.headerContent}>
          <img src="/spacetraveling.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}