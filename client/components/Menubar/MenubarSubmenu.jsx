// https://blog.logrocket.com/building-accessible-menubar-component-react

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  useMemo
} from 'react';
import {
  MenuOpenContext,
  MenubarContext,
  SubmenuContext,
  ParentMenuContext
} from './contexts';
import TriangleIcon from '../../images/down-filled-triangle.svg';

export function useMenuProps(id) {
  const activeMenu = useContext(MenuOpenContext);

  const isOpen = id === activeMenu;

  const { createMenuHandlers } = useContext(MenubarContext);

  const handlers = useMemo(() => createMenuHandlers(id), [
    createMenuHandlers,
    id
  ]);

  return { isOpen, handlers };
}

/* -------------------------------------------------------------------------------------------------
 * MenubarTrigger
 * -----------------------------------------------------------------------------------------------*/

/**
 * @component
 * @param {Object} props
 * @param {string} props.id - The id of submenu the trigger button controls
 * @param {string} props.title - The title of the trigger button
 * @param {string} [props.role='menuitem'] - The ARIA role of the trigger button
 * @param {string} [props.hasPopup='menu'] - The ARIA property that indicates the presence of a popup
 * @returns {JSX.Element}
 */

/**
 * MenubarTrigger renders a button that toggles a submenu. It handles keyboard navigations and supports
 * screen readers. It needs to be within a submenu context.
 *
 * @example
 * <li
 *  className={classNames('nav__item', isOpen && 'nav__item--open')}
 *  ref={listItemRef}
 * >
 *  <MenubarTrigger
 *    ref={buttonRef}
 *    id={id}
 *    title={title}
 *    role={triggerRole}
 *    hasPopup={hasPopup}
 *    {...handlers}
 *    {...props}
 *    tabIndex={-1}
 *  />
 *  ... menubar list
 * </li>
 */

const MenubarTrigger = React.forwardRef(
  ({ id, role, title, hasPopup, ...props }, ref) => {
    const { isOpen, handlers } = useMenuProps(id);
    const {
      setActiveIndex,
      menuItems,
      registerTopLevelItem,
      hasFocus,
      toggleMenuOpen
    } = useContext(MenubarContext);
    const { first, last } = useContext(SubmenuContext);

    // update active index when mouse enters the trigger and the menu has focus
    const handleMouseEnter = () => {
      if (hasFocus) {
        const items = Array.from(menuItems);
        const index = items.findIndex((item) => item === ref.current);

        if (index !== -1) {
          setActiveIndex(index);
        }
      }
    };

    // keyboard handlers
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          if (!isOpen) {
            e.preventDefault();
            e.stopPropagation();
            first();
          }
          break;
        case 'ArrowUp':
          if (!isOpen) {
            e.preventDefault();
            e.stopPropagation();
            last();
          }
          break;
        case 'Enter':
        case ' ':
          if (!isOpen) {
            e.preventDefault();
            e.stopPropagation();
            first();
          }
          break;
        default:
          break;
      }
    };

    // register trigger with parent menubar
    useEffect(() => {
      const unregister = registerTopLevelItem(ref, id);
      return unregister;
    }, [menuItems, registerTopLevelItem]);

    return (
      <button
        {...props}
        {...handlers}
        ref={ref}
        role={role}
        onMouseEnter={handleMouseEnter}
        onKeyDown={handleKeyDown}
        aria-haspopup={hasPopup}
        aria-expanded={isOpen}
      >
        <span className="nav__item-header">{title}</span>
        <TriangleIcon
          className="nav__item-header-triangle"
          focusable="false"
          aria-hidden="true"
        />
      </button>
    );
  }
);

MenubarTrigger.propTypes = {
  id: PropTypes.string.isRequired,
  role: PropTypes.string,
  title: PropTypes.node.isRequired,
  hasPopup: PropTypes.oneOf(['menu', 'listbox', 'true'])
};

MenubarTrigger.defaultProps = {
  role: 'menuitem',
  hasPopup: 'menu'
};

/* -------------------------------------------------------------------------------------------------
 * MenubarList
 * -----------------------------------------------------------------------------------------------*/

/**
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - MenubarItems that should be rendered in the list
 * @param {string} props.id - The unique id of the submenu
 * @param {string} [props.role='menu'] - The ARIA role of the list element
 * @returns {JSX.Element}
 */

/**
 * MenubarList renders the container for menu items in a submenu. It provides context and handles ARIA roles.
 *
 * @example
 * <MenubarList id={id} role={listRole}>
 *  ... <MenubarItem> elements
 * </MenubarList>
 */

function MenubarList({ children, id, role, ...props }) {
  return (
    <ul className="nav__dropdown" role={role} {...props}>
      <ParentMenuContext.Provider value={id}>
        {children}
      </ParentMenuContext.Provider>
    </ul>
  );
}

MenubarList.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  role: PropTypes.oneOf(['menu', 'listbox'])
};

MenubarList.defaultProps = {
  children: null,
  role: 'menu'
};

/* -------------------------------------------------------------------------------------------------
 * MenubarSubmenu
 * -----------------------------------------------------------------------------------------------*/

/**
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - A list of menu items that will be rendered in the menubar
 * @param {string} props.id - The unique id of the submenu
 * @param {string} props.title - The title of the submenu
 * @param {string} [props.triggerRole='menuitem'] - The ARIA role of the trigger button
 * @param {string} [props.listRole='menu'] - The ARIA role of the list element
 * @returns {JSX.Element}
 */

/**
 * MenubarSubmenu manages a triggerable submenu within a menubar. It is a compound component
 * that manages the state of the submenu and its items. It also provides keyboard navigation
 * and screen reader support. Supports menu and listbox roles. Needs to be a direct child of Menubar.
 *
 * @example
 * <Menubar>
 *  <MenubarSubmenu id="file" title="File">
 *    <MenubarItem id="file-new" onClick={handleNew}>New </MenubarItem>
 *    <MenubarItem id="file-save" onClick={handleSave}>Save</MenubarItem>
 *  </MenubarSubmenu>
 * </Menubar>
 */

function MenubarSubmenu({
  children,
  id,
  title,
  triggerRole: customTriggerRole,
  listRole: customListRole,
  ...props
}) {
  // core state for submenu management
  const { isOpen, handlers } = useMenuProps(id);
  const [submenuActiveIndex, setSubmenuActiveIndex] = useState(0);
  const [isFirstChild, setIsFirstChild] = useState(false);
  const { menuOpen, setMenuOpen, toggleMenuOpen } = useContext(MenubarContext);
  const submenuItems = useRef(new Set()).current;

  // refs for the button and list elements
  const buttonRef = useRef(null);
  const listItemRef = useRef(null);

  // roles and properties for the button and list elements
  const triggerRole = customTriggerRole || 'menuitem';
  const listRole = customListRole || 'menu';
  const hasPopup = listRole === 'listbox' ? 'listbox' : 'menu';

  /**
   * navigation functions for the submenu
   */
  const prev = useCallback(() => {
    const newIndex =
      submenuActiveIndex < 0
        ? submenuItems.size - 1
        : (submenuActiveIndex - 1 + submenuItems.size) % submenuItems.size;
    setSubmenuActiveIndex(newIndex);
  }, [submenuActiveIndex, submenuItems]);

  const next = useCallback(() => {
    const newIndex = (submenuActiveIndex + 1) % submenuItems.size;
    setSubmenuActiveIndex(newIndex);
  }, [submenuActiveIndex, submenuItems]);

  const first = useCallback(() => {
    toggleMenuOpen(id);

    if (submenuItems.size > 0) {
      setSubmenuActiveIndex(0);
    }
  }, [submenuItems]);

  const last = useCallback(() => {
    toggleMenuOpen(id);
    if (submenuItems.size > 0) {
      setSubmenuActiveIndex(submenuItems.size - 1);
    }
  }, [submenuItems]);

  // activate the selected item
  const activate = useCallback(() => {
    const items = Array.from(submenuItems);
    const activeItem = items[submenuActiveIndex]; // get the active item

    if (activeItem) {
      // since active item is a <li> element, we need to get the button or link inside it
      const activeItemNode = activeItem.firstChild;
      activeItemNode.click();

      toggleMenuOpen(id);

      // check if buttonRef is available and focus it
      // we check because the button might be unmounted when activating a link or button
      if (buttonRef.current) {
        buttonRef.current.focus();
      }
    }
  }, [submenuActiveIndex, submenuItems, buttonRef]);

  const close = useCallback(() => {
    setMenuOpen('none');

    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [buttonRef]);

  /**
   * Register submenu items for keyboard navigation.
   *
   * @param {React.RefObject} ref - a ref to the DOM node of the menu item
   *
   */
  const registerSubmenuItem = useCallback(
    (ref) => {
      const submenuItemNode = ref.current;

      if (submenuItemNode) {
        if (submenuItems.size === 0) {
          setIsFirstChild(true);
        }

        submenuItems.add(submenuItemNode);
      }

      return () => {
        submenuItems.delete(submenuItemNode);
      };
    },
    [submenuItems]
  );

  // memoized key handlers for submenu navigation
  const keyHandlers = useMemo(
    () => ({
      ArrowUp: (e) => {
        if (!isOpen) return;
        e.preventDefault();
        e.stopPropagation();
        prev();
      },
      ArrowDown: (e) => {
        if (!isOpen) return;
        e.preventDefault();
        e.stopPropagation();
        next();
      },
      Enter: (e) => {
        if (!isOpen) return;
        e.preventDefault();
        e.stopPropagation();
        activate();
      },
      ' ': (e) => {
        // same as Enter
        if (!isOpen) return;
        e.preventDefault();
        e.stopPropagation();
        activate();
      },
      Escape: (e) => {
        if (!isOpen) return;
        e.preventDefault();
        e.stopPropagation();
        close();
      },
      Tab: (e) => {
        // close
        if (!isOpen) return;
        // e.preventDefault();
        e.stopPropagation();
        setMenuOpen('none');
      }
      // support direct access keys
    }),
    [isOpen, submenuItems, submenuActiveIndex]
  );

  // our custom keydown handler
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      const handler = keyHandlers[e.key];

      if (handler) {
        handler(e);
      }
    },
    [isOpen, keyHandlers]
  );

  // reset submenu active index when submenu is closed
  useEffect(() => {
    if (!isOpen) {
      setSubmenuActiveIndex(-1);
    }
  }, [isOpen]);

  // add keydown event listener to list when submenu is open
  useEffect(() => {
    const el = listItemRef.current;
    if (!el) return () => {};

    el.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, keyHandlers]);

  // focus the active item when submenu is open
  useEffect(() => {
    if (isOpen && submenuItems.size > 0) {
      const items = Array.from(submenuItems);
      const activeItem = items[submenuActiveIndex];

      if (activeItem) {
        const activeNode = activeItem.querySelector(
          '[role="menuitem"], [role="option"]'
        );
        if (activeNode) {
          activeNode.focus();
        }
      }
    }
  }, [isOpen, submenuItems, submenuActiveIndex]);

  const submenuContext = useMemo(
    () => ({
      submenuItems,
      submenuActiveIndex,
      setSubmenuActiveIndex,
      registerSubmenuItem,
      isFirstChild,
      first,
      last
    }),
    [
      submenuItems,
      submenuActiveIndex,
      setSubmenuActiveIndex,
      registerSubmenuItem,
      isFirstChild,
      first,
      last
    ]
  );

  return (
    <SubmenuContext.Provider value={submenuContext}>
      <li
        className={classNames('nav__item', isOpen && 'nav__item--open')}
        ref={listItemRef}
      >
        <MenubarTrigger
          ref={buttonRef}
          id={id}
          title={title}
          role={triggerRole}
          hasPopup={hasPopup}
          {...handlers}
          {...props}
          tabIndex={-1}
        />
        <MenubarList id={id} role={listRole}>
          {children}
        </MenubarList>
      </li>
    </SubmenuContext.Provider>
  );
}

MenubarSubmenu.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  title: PropTypes.node.isRequired,
  triggerRole: PropTypes.string,
  listRole: PropTypes.string
};

MenubarSubmenu.defaultProps = {
  children: null,
  triggerRole: 'menuitem',
  listRole: 'menu'
};

export default MenubarSubmenu;
