'use strict';

import _ from 'underscore';
import Registry from './Registry';
import PositionCalculator from './PositionCalculator';

class RowRepository {
  constructor(data) {
    this.registry = new Registry(data);
    this.positionCalculator = new PositionCalculator();
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

  move(draggedItem, x, y) {
    const fromColumnId = draggedItem.columnId();
    const columnAtPosition = this.positionCalculator.columnAtPosition(this.columns(), x, y);
    if (!columnAtPosition) {
      return;
    }

    const toColumnId = columnAtPosition.id();
    let items = this.visibleItems(toColumnId);
    const itemAtPosition = this.positionCalculator.itemAtPosition(items, toColumnId, x, y, draggedItem);
    if (!itemAtPosition) {
      return columnAtPosition;
    }

    const draggedId = draggedItem.id();
    const itemAtPositionId = itemAtPosition.id();

    if (draggedItem.id() == itemAtPosition.id()) {
      return columnAtPosition;
    }

    console.log(['DRAG FROM', x, y, draggedItem.columnId(), draggedItem._attributes.index, draggedItem.id(), draggedItem._attributes.row.name, draggedItem._attributes.layout])

    if (toColumnId != fromColumnId) {
      this.moveToOtherColumn(fromColumnId, toColumnId, draggedItem);
    }

    console.log(['DRAG TO', x, y, itemAtPosition.columnId(), itemAtPosition._attributes.index, itemAtPosition.id(), itemAtPosition._attributes.row.name, itemAtPosition.layout()])

    this.switchItemsBetween(draggedItem, itemAtPosition, toColumnId);

    const itemsFrom = this.visibleItems(fromColumnId)
    console.log(['AFTER FROM', fromColumnId, itemsFrom.map((item) => [item.index(), item._attributes.row.name, item.layout()])]);
    const itemsTo = this.visibleItems(toColumnId)
    console.log(['AFTER TO', toColumnId, itemsTo.map((item) => [item.index(), item._attributes.row.name, item.layout()])]);

    return columnAtPosition;
  }

  moveToOtherColumn(fromColumnId, toColumnId, item) {
    const fromItems = this.items(fromColumnId);
    for (const i of _.range(fromItems.length - 1, item.index(), -1)) {
      let fromItem = fromItems[i];
      fromItem.setIndex(fromItem.index() - 1);
      const newY = fromItems[i - 1].layout().y;
      fromItem.setLayout(Object.assign(fromItem.layout(), { y: newY }));
    }
    this.registry.move(fromColumnId, toColumnId, item);
    this.notify(fromColumnId, 'reload');

    item.setVisible(true);
    item.setIndex(-1);
    const items = this.items(toColumnId);
    for (const item of items) {
      item.setIndex(item.index() + 1);
    }

    const visibleItems = this.visibleItems(toColumnId);
    // TODO: ten ostatni nie zawsze jest wypchniety!
    // jak lista nie wychodzi poza ekran to nie jest!
    //visibleItems[visibleItems.length - 1].setVisible(false);
    for (const i of _.range(0, visibleItems.length - 1)) {
      visibleItems[i].setLayout(Object.assign({}, visibleItems[i + 1].layout()));
    }
    const lastItem = visibleItems[visibleItems.length - 1];
    const lastLayout = lastItem.layout();
    const newLastY = lastLayout.y + lastLayout.height;
    lastItem.setLayout(Object.assign(lastLayout, { y: newLastY }));
  }

  switchItemsBetween(draggedItem, itemAtPosition, toColumnId) {
    console.log('SWITCHING')
    draggedItem.setVisible(true);

    console.log(['BEFORE TO', toColumnId, this.visibleItems(toColumnId).map((item) => [item._attributes.index, item._attributes.row.name, item.layout()])]);

    let items = this.visibleItems(toColumnId);
    const draggedItemI = _(items).findIndex((item) => item.id() == draggedItem.id());
    const itemAtPositionI = _(items).findIndex((item) => item.id() == itemAtPosition.id());
    let range;
    if (draggedItem.index() < itemAtPosition.index()) {
      range = _.range(draggedItemI, itemAtPositionI);
    } else {
      range = _.range(itemAtPositionI, draggedItemI);
    }

    for (const i of range) {
      const firstItem = items[i];
      const secondItem = items[i + 1];
      this.switchItems(toColumnId, firstItem, secondItem);
      items = this.visibleItems(toColumnId);
    }
    this.notify(toColumnId, 'reload');
  }

  switchItems(columnId, firstItem, secondItem) {
    if (!firstItem || !secondItem) {
      return;
    }

    let firstId = firstItem.id();
    let secondId = secondItem.id();
    let firstIndex = firstItem.index();
    let secondIndex = secondItem.index();
    let firstY = firstItem.layout().y;
    let secondHeight = secondItem.layout().height;
    let firstRef = firstItem.ref();
    let secondRef = secondItem.ref();

    firstItem.setIndex(secondIndex);
    secondItem.setIndex(firstIndex);

    firstItem.setLayout(Object.assign(firstItem.layout(), { y: firstY + secondHeight }));
    secondItem.setLayout(Object.assign(secondItem.layout(), { y: firstY }));

    firstItem.setRef(secondRef);
    secondItem.setRef(firstRef);
  }
};

export default RowRepository;
