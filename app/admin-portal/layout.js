import { Poppins } from "next/font/google";
import styles from "./layout.module.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata = {
  title: "Tomama — Admin",
};

export default function AdminLayout({ children }) {
  return (
    <div className={`${poppins.variable} ${styles.adminRoot}`}>
      {children}
    </div>
  );
}
