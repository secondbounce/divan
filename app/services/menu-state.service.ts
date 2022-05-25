import { ContextMenuParams, Menu, MenuItem } from 'electron';

import { MenuId } from '../../src/app/enums';
import { Logger } from '../logger';

/**
 * NOTE  Because Electron doesn't currently provide a way to remove menu items, we're having
 * to recreate the menu when items are being added/removed from the 'Recently Used' servers
 * menu.  This means that we can't just hold a reference to the menu and use that internally
 * since it will be redundant as soon as the menu is recreated.
 */
export class MenuStateService {
  private static _instance: MenuStateService;
  private _lastMenuState: Map<string, boolean> = new Map<string, boolean>();
  private readonly _log: Logger;

  constructor() {
    this._log = new Logger('MenuStateService');
  }

  public static get instance(): MenuStateService {
    return this._instance || (this._instance = new this());
  }

  public disableMainMenu(): void {
    /* If the menu has already been disabled, we don't want to do it again (which would
      overwrite the saved state with all disabled states).
    */
    if (this._lastMenuState.size === 0) {
      const mainMenu: Menu = this.getMainMenu();

      /* For the File menu, disable all sub-items except the Exit item */
      let submenu: Menu | undefined = this.getMenuItem(mainMenu, MenuId.File).submenu;
      if (submenu) {
        for (const menuItem of submenu.items) {
          if (menuItem.id !== MenuId.FileExit) {
            this.disableMenuItem(menuItem);
          }
        }
      }

// TODO: at the moment, the only other menu is Edit, which is still (potentially) valid for use with
// modal dialogs, but if we add any others, their items will need disabling too.

      /* For the (mac-only) Application menu, disable just the About item */
      submenu = mainMenu.getMenuItemById(MenuId.Application)?.submenu;
      if (submenu) {
        const menuItem: MenuItem | undefined = submenu.items.find(item => item.role === 'about');
        if (menuItem) {
          this.disableMenuItem(menuItem);
        }
      }
    }
  }

  private disableMenuItem(menuItem: MenuItem): void {
    if (menuItem.type !== 'separator') {
      this._lastMenuState.set(menuItem.id, menuItem.enabled);
      menuItem.enabled = false;
    }
  }

  public reenableMainMenu(): void {
    const mainMenu: Menu = this.getMainMenu();
    let menuItem: MenuItem;

    for (const [menuId, enabled] of this._lastMenuState) {
      menuItem = this.getMenuItem(mainMenu, menuId);
      menuItem.enabled = enabled;
    }

    this._lastMenuState.clear();
  }

  public setMenuItemState(menuId: MenuId | string, enabled: boolean): void {
    /* If this is called while the main menu is disabled, just change the corresponding value
      in the saved state as it'll get set later.
    */
    if (this._lastMenuState.has(menuId)) {
      this._lastMenuState.set(menuId, enabled);
    } else {
      const mainMenu: Menu = this.getMainMenu();
      const menuItem: MenuItem = this.getMenuItem(mainMenu, menuId);
      menuItem.enabled = enabled;
    }
  }

  public setEditMenuItemsState(editMenu: Menu, props: ContextMenuParams): void {
    this.setMenuItemStateByRole(editMenu, 'undo', props.editFlags.canUndo);
    this.setMenuItemStateByRole(editMenu, 'redo', props.editFlags.canRedo);
    this.setMenuItemStateByRole(editMenu, 'cut', props.editFlags.canCut);
    this.setMenuItemStateByRole(editMenu, 'copy', props.editFlags.canCopy);
    this.setMenuItemStateByRole(editMenu, 'paste', props.editFlags.canPaste);
    this.setMenuItemStateByRole(editMenu, 'pasteAndMatchStyle', props.editFlags.canEditRichly);
    this.setMenuItemStateByRole(editMenu, 'delete', props.editFlags.canDelete);
    this.setMenuItemStateByRole(editMenu, 'selectall', props.editFlags.canSelectAll);
  }

  private getMainMenu(): Menu {
    const menu: Menu | null = Menu.getApplicationMenu();
    if (menu === null) {
      this._log.error('Application menu has not been set');
      throw new Error('Application menu has not been set');
    }

    return menu;
  }

  private getMenuItem(menu: Menu, menuId: MenuId | string): MenuItem {
    const menuItem: MenuItem | null = menu.getMenuItemById(menuId);

    if (menuItem === null) {
      const message: string = `Menu item ${menuId} could not be found`;
      this._log.error(message);
      throw new Error(message);
    }

    return menuItem;
  }

  private setMenuItemStateByRole(menu: Menu, role: string, enabled: boolean): void {
    const menuItem: MenuItem | undefined = menu.items.find(item => item.role === role);
    if (menuItem) {
      menuItem.enabled = enabled;
    }
  }
}
