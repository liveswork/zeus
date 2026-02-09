import React, { createContext, useContext, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from '../config/firebase';

type MenuItem = { key: string; label: string; route: string; order: number };

type MenuState = {
  menuItems: MenuItem[];
  capabilities: Record<string, boolean>;
  profileIds: {
    categoryKey?: string;
    subCategoryKey?: string;
    menuProfileId?: string;
    capabilityProfileId?: string;
  };
  hydrated: boolean;
};

type MenuContextValue = MenuState & {
  loadMenuForUser: (userDoc: any) => Promise<void>;
  resetMenu: () => void;
};

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MenuState>({
    menuItems: [],
    capabilities: {},
    profileIds: {},
    hydrated: false
  });

  async function loadMenuForUser(userDoc: any) {
    const type = userDoc?.businessProfile?.type;         // ex: "retail"
    const sub = userDoc?.businessProfile?.subCategory;   // ex: "loja_de_roupas"

    if (!type) {
      // fallback mínimo: evita tela quebrada
      setState({
        menuItems: [{ key: "dashboard", label: "Dashboard", route: "/app", order: 1 }],
        capabilities: {},
        profileIds: {},
        hydrated: true
      });
      return;
    }

    // 1) pega categoria
    const catSnap = await getDoc(doc(db, "business_categories", type));
    const cat = catSnap.exists() ? catSnap.data() : null;

    // 2) pega subcategoria
    let subData: any = null;
    if (sub) {
      const subSnap = await getDoc(doc(db, "business_subcategories", sub));
      subData = subSnap.exists() ? subSnap.data() : null;
    }

    // 3) resolve ids finais (override por subCategory)
    const menuProfileId =
      subData?.menuProfileId ?? cat?.defaultMenuProfileId;

    const capabilityProfileId =
      subData?.capabilityProfileId ?? cat?.defaultCapabilityProfileId;

    // 4) carrega profiles
    const [menuSnap, capsSnap] = await Promise.all([
      menuProfileId ? getDoc(doc(db, "menu_profiles", menuProfileId)) : Promise.resolve(null as any),
      capabilityProfileId ? getDoc(doc(db, "capability_profiles", capabilityProfileId)) : Promise.resolve(null as any)
    ]);

    const menuProfile = menuSnap?.exists?.() ? menuSnap.data() : null;
    const capsProfile = capsSnap?.exists?.() ? capsSnap.data() : null;

    const items: MenuItem[] = (menuProfile?.items ?? [])
      .slice()
      .sort((a: MenuItem, b: MenuItem) => (a.order ?? 999) - (b.order ?? 999));

    setState({
      menuItems: items.length ? items : [{ key: "dashboard", label: "Dashboard", route: "/app", order: 1 }],
      capabilities: capsProfile?.flags ?? {},
      profileIds: {
        categoryKey: type,
        subCategoryKey: sub,
        menuProfileId,
        capabilityProfileId
      },
      hydrated: true
    });
  }

  function resetMenu() {
    setState({
      menuItems: [],
      capabilities: {},
      profileIds: {},
      hydrated: false
    });
  }

  const value = useMemo(
    () => ({ ...state, loadMenuForUser, resetMenu }),
    [state]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within a MenuProvider");
  return ctx;
}
