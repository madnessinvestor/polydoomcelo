import { createContext, useContext, useState, ReactNode } from "react";

type UIContextType = {
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  isLocked: boolean;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (modalId: string) => {
    if (!activeModal) {
      setActiveModal(modalId);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <UIContext.Provider 
      value={{ 
        activeModal, 
        openModal, 
        closeModal, 
        isLocked: activeModal !== null 
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
