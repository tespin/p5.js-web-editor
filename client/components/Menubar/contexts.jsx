import { set } from 'lodash';
import { createContext } from 'react';

export const ParentMenuContext = createContext('none');

export const MenuOpenContext = createContext('none');

export const MenubarContext = createContext({
  createMenuHandlers: () => ({}),
  createMenuItemHandlers: () => ({}),
  toggleMenuOpen: () => {},
  activeIndex: -1,
  setActiveIndex: () => {},
  registerItem: () => {},
  menuItems: []
});

export const SubmenuContext = createContext({
  // submenu state
  submenuActiveIndex: -1,
  setSubmenuActiveIndex: () => {},
  registerSubmenuItem: () => {},
  submenuItems: []
});
