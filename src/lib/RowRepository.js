'use strict';

import _ from 'underscore';
import Registry from './Registry';
import PositionCalculator from './PositionCalculator';
import Mover from './Mover';

class RowRepository {
  constructor(data) {
    this.registry = new Registry(data);
    this.positionCalculator = new PositionCalculator();
    this.mover = new Mover(this.positionCalculator);
    this.listeners = {};
  }

  columns() {
    return this.registry.columns();
  }

  column(columnId) {
    return this.registry.column(columnId);
  }

  items(columnId) {
    return this.registry.items(columnId);
  }

  visibleItems(columnId) {
    return this.registry.visibleItems(columnId);
  }

  updateData(data) {
    this.registry.updateData(data);
  }

  addListener(columnId, event, callback) {
    const forColumn = this.listeners[columnId];
    this.listeners[columnId] = Object.assign(forColumn || {}, {
      [event]: callback
    });
  }

  notify(columnId, event) {
    this.listeners[columnId][event]();
  }

  setScrollOffset(columnId, scrollOffset) {
    const column = this.registry.column(columnId);
    column.setScrollOffset(scrollOffset);
  }

  setContentHeight(columnId, contentHeight) {
    const column = this.registry.column(columnId);
    column.setContentHeight(contentHeight);
  }

  setItemRef(columnId, item, ref) {
    item.setRef(ref);
  }

  setListView(columnId, listView) {
    const column = this.registry.column(columnId);
    column && column.setListView(listView);
  }

  updateItemWithLayout(columnId, item, previousItem) {
    item.measureAndSaveLayout(previousItem);
  }

  updateLayoutAfterVisibilityChanged(columnId) {
    const items = this.items(columnId);
    const range = _.range(items.length);
    for (let i of range) {
      this.updateItemWithLayout(columnId, items[i], items[i - 1]);
    }
  }

  updateItemsVisibility(columnId, visibleItemsInSections) {
    const visibleItems = visibleItemsInSections.s1;
    const items = this.items(columnId);
    for (let item of items) {
      if (visibleItems) {
        item.setVisible(visibleItems[item.index()]);
      }
    }
    this.updateLayoutAfterVisibilityChanged(columnId);
  }

  setColumnRef(columnId, ref) {
    const column = this.registry.column(columnId);
    column && column.setRef(ref);
  }

  updateColumnWithLayout(columnId) {
    const column = this.registry.column(columnId);
    column && column.measureAndSaveLayout();
  }

  scrollingPosition(columnAtPosition, x, y) {
    return this.positionCalculator.scrollingPosition(columnAtPosition, x, y);
  }

  updateColumnsLayoutAfterVisibilityChanged() {
    const columns = this.columns();
    for (const column of columns) {
      const columnId = column.id();
      this.updateColumnWithLayout(columnId);
      this.updateLayoutAfterVisibilityChanged(columnId);
    }
  }

  hide(columnId, item) {
    item.setHidden(true);
  }

  show(columnId, item) {
    item.setHidden(false);
  }

  showAll() {
    const columns = this.columns();
    for (const column of columns) {
      const items = this.items(column.id());
      for (const item of items) {
        this.show(column.id(), item);
      }
    }
  }

  move(draggedItem, x, y) {
    return this.mover.move(this, this.registry, draggedItem, x, y);
  }
};

export default RowRepository;
