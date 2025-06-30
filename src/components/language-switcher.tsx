import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { LANGUAGES, saveLanguageToStorage, type LanguageCode } from "@/i18n";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LanguageSwitcherProps {
  className?: string;
  authOnly?: boolean; // If true, only save to localStorage (for auth pages)
}

export function LanguageSwitcher({
  className = "",
  authOnly = false,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const { currentUser, userProfile } = useAuth();

  const handleLanguageChange = async (language: LanguageCode) => {
    // Always save to localStorage for fast retrieval
    saveLanguageToStorage(language);

    // Change the current language
    await i18n.changeLanguage(language);

    // If not authOnly and user is logged in, also update user profile
    if (!authOnly && currentUser && userProfile) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, {
          language: language,
        });
      } catch (error) {
        console.warn("Failed to update user language preference:", error);
      }
    }
  };

  const currentLanguage = i18n.language as LanguageCode;

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      {Object.entries(LANGUAGES).map(([code, lang], index) => (
        <span key={code} className="flex items-center">
          <button
            onClick={() => handleLanguageChange(code as LanguageCode)}
            className={`hover:text-primary transition-colors cursor-pointer ${
              currentLanguage === code
                ? "font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang.name}
          </button>
          {index < Object.entries(LANGUAGES).length - 1 && (
            <span className="mx-1 text-muted-foreground">|</span>
          )}
        </span>
      ))}
    </div>
  );
}
