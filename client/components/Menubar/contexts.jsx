import { set } from 'lodash';
import { createContext } from 'react';

export const ParentMenuContext = createContext('none');

export const MenuOpenContext = createContext('none');

export const MenubarContext = createContext({
  createMenuHandlers: () => ({}),
  createMenuItemHandlers: () => ({}),
  toggleMenuOpen: () => {},
  oldActiveIndex: -1,
  setOldActiveIndex: () => {},
  oldRegisterItem: () => {},
  oldMenuItems: []
});

export const SubmenuContext = createContext({
  // submenu state
  oldSubmenuActiveIndex: -1,
  setOldSubmenuActiveIndex: () => {},
  oldRegisterSubmenuItem: () => {},
  oldSubmenuItems: []
});
