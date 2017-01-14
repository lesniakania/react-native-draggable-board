'use strict';

import _ from 'underscore';
import Registry from './Registry';

class RowRepository {
  TRESHOLD = 35

  constructor() {
    this.registry = new Registry();
    this.listeners = {};
  }

  columns() {
    return this.registry.columns();
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
    const items = this.visibleItems(columnId);
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

  updateColumnsLayoutAfterVisibilityChanged() {
    const columns = this.columns();
    for(const column of columns) {
      const columnId = column.id;
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
    let columnAtPosition = this.columnAtPosition(x, y);
    if (!columnAtPosition) {
      return;
    }

    let toColumnId = columnAtPosition.id();
    let itemAtPosition = this.itemAtPosition(toColumnId, x, y);
    if (!itemAtPosition) {
      return columnAtPosition;
    }

    let draggedId = draggedItem.id();
    console.log(['DRAG FROM', x, y, draggedItem.columnId(), draggedItem._attributes.index, draggedItem.id(), draggedItem._attributes.row.title, draggedItem._attributes.layout])
    if (toColumnId != fromColumnId) {
      let fromColumn = this.registry.column(fromColumnId);
      let toColumn = this.registry.column(toColumnId);

      this.registry.move(fromColumn, toColumn, draggedItem);
      this.notify(fromColumnId, 'reload');

      draggedItem.setVisible(true);
      draggedItem.setIndex(-1);
      const items = this.items(toColumnId);
      for (const item of items) {
        item.setIndex(item.index() + 1);
      }

      const visibleItems = this.visibleItems(toColumnId);
      // TODO: ten ostatni nie zawsze jest wypchniety!
      // jak lista nie wychodzi poza ekran to nie jest!
      //visibleItems[visibleItems.length - 1].visible = false;
      let i = 0;
      while (i < visibleItems.length - 1) {
        visibleItems[i].setLayout(visibleItems[i + 1].layout());
        i += 1;
      }
    }

    let itemAtPositionId = itemAtPosition.id();
    console.log(['DRAG TO', x, y, itemAtPosition.columnId(), itemAtPosition._attributes.index, itemAtPosition.id(), itemAtPosition._attributes.row.title, itemAtPosition.layout()])

    if (draggedItem.id() == itemAtPosition.id()) {
      return columnAtPosition;
    }

    console.log('SWITCHING')
    draggedItem.setVisible(true);
    let items = this.visibleItems(toColumnId);

    console.log(['BEFORE TO', toColumnId, items.map((item) => [item._attributes.index, item._attributes.row.title, item.layout()])]);

    let draggedItemI = _(items).findIndex((item) => item.id() == draggedItem.id());
    let itemAtPositionI = _(items).findIndex((item) => item.id() == itemAtPosition.id());
    if (draggedItem.index() < itemAtPosition.index()) {
      let i = draggedItemI;
      console.log(['draggedItem.index < itemAtPosition.index: i', i])
      while(i < itemAtPositionI) {
        let firstItem = items[i];
        let secondItem = items[i + 1];
        this.switchItems(toColumnId, firstItem, secondItem);
        items = this.visibleItems(toColumnId);
        i += 1;
      }
    } else {
      let i = itemAtPositionI;
      console.log(['draggedItem.index >= itemAtPosition.index: i', i])
      while(i < draggedItemI) {
        let firstItem = items[i];
        let secondItem = items[i + 1];
        this.switchItems(toColumnId, firstItem, secondItem);
        items = this.visibleItems(toColumnId);
        i += 1;
      }
    }

    this.notify(toColumnId, 'reload');

    const itemsFrom = this.visibleItems(fromColumnId)
    console.log(['AFTER FROM', fromColumnId, itemsFrom.map((item) => [item.index(), item._attributes.row.title, item.layout()])]);
    const itemsTo = this.visibleItems(toColumnId)
    console.log(['AFTER TO', toColumnId, itemsTo.map((item) => [item.index(), item._attributes.row.title, item.layout()])]);

    return columnAtPosition;
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

  columnAtPosition(x, y) {
    let columns = this.columns();
    let column = columns.find((column) => {
      let layout = column.layout();

      const left = x > layout.x;
      const right = x < layout.x + layout.width;
      const up = y > layout.y - this.TRESHOLD;
      const down = y < layout.y + layout.height + this.TRESHOLD;

      return layout && left && right && up && down;
    });

    return column;
  }

  scrollingPosition(column, x, y) {
    let layout = column.layout();

    let upperEnd = layout.y;
    let upper = y > upperEnd - this.TRESHOLD && y < upperEnd + this.TRESHOLD;

    let lowerEnd = layout.y + layout.height;
    let lower = y > lowerEnd - this.TRESHOLD && y < lowerEnd + this.TRESHOLD;

    let offset = lower ? 1 : (upper ? -1 : 0);

    return {
      offset: offset,
      scrolling: x > layout.x && x < layout.x + layout.width && (lower || upper)
    };
  }

  itemAtPosition(columnId, x, y) {
    let items = this.visibleItems(columnId);

    let item = items.find((item) => {
      const layout = item.layout();
      const left = x > layout.x;
      const right = x < layout.x + layout.width;
      const up = y < layout.y + layout.height;
      const down = y > layout.y;
      return layout && left && right && up && down;
    });

    let firstItem = items[0];
    if (!item && firstItem && firstItem.layout() && y <= firstItem.layout().y) {
      item = firstItem;
    }

    let lastItem = items[items.length - 1];
    if (!item && lastItem && lastItem.layout() && y >= lastItem.layout().y) {
      item = lastItem;
    }

    return item;
  }
};

export default RowRepository;
