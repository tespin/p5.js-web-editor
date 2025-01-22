import PropTypes from 'prop-types';
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import ButtonOrLink from '../../common/ButtonOrLink';
import { MenubarContext, SubmenuContext, ParentMenuContext } from './contexts';

function MenubarItem({
  id,
  hideIf,
  className,
  role: customRole,
  selected,
  ...rest
}) {
  const { createMenuItemHandlers } = useContext(MenubarContext);
  const { submenuItems, registerSubmenuItem, isFirstChild } = useContext(
    SubmenuContext
  );
  const menuItemRef = useRef(null);
  const parent = useContext(ParentMenuContext);

  const handlers = useMemo(() => createMenuItemHandlers(parent), [
    createMenuItemHandlers,
    parent
  ]);

  if (hideIf) {
    return null;
  }

  const role = customRole || 'menuitem';
  const ariaSelected = role === 'option' ? { 'aria-selected': selected } : {};

  useEffect(() => {
    const unregister = registerSubmenuItem(menuItemRef);
    return unregister;
  }, [submenuItems, registerSubmenuItem]);

  return (
    <li className={className} ref={menuItemRef}>
      <ButtonOrLink
        {...rest}
        {...handlers}
        {...ariaSelected}
        role={role}
        tabIndex={isFirstChild ? 0 : -1}
        id={id}
      />
    </li>
  );
}

MenubarItem.propTypes = {
  ...ButtonOrLink.propTypes,
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  value: PropTypes.string,
  /**
   * Provides a way to deal with optional items.
   */
  hideIf: PropTypes.bool,
  className: PropTypes.string,
  role: PropTypes.oneOf(['menuitem', 'option']),
  selected: PropTypes.bool
};

MenubarItem.defaultProps = {
  onClick: null,
  value: null,
  hideIf: false,
  className: 'nav__dropdown-item',
  role: 'menuitem',
  selected: false
};

export default MenubarItem;
