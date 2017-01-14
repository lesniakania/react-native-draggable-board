'use strict';

import _ from 'underscore';

class RowRepository {
  constructor() {
    this.registry = {};
    this.listeners = {};
  }

  updateData(data) {
    const columns = _.range(data.length).map((columnIndex) => {
      const columnData = data[columnIndex];
      const rows = columnData.rows;
      const items = _.range(rows.length).map((index) => {
        const row = rows[index];
        return { id: row.id, index: index, columnId: columnIndex, row: row };
      });
      const existingColumn = this.registry[columnIndex] || {
        id: columnIndex,
        index: columnIndex,
        scrollOffset: 0
      };
      const itemsMap = {};
      for (const item of items) {
        const existingItem = existingColumn.items[item.id] || {};
        itemsMap[item.id] = Object.assign(existingItem, item);
      }
      return Object.assign(existingColumn, {
        items: itemsMap,
        data: columnData
      });
    });
    for (const column of columns) {
      this.registry[column.id] = column;
    }
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

  column(columnId) {
    return this.registry[columnId];
  }

  setScrollOffset(columnId, scrollOffset) {
    this.registry[columnId].scrollOffset = scrollOffset;
  }

  registerItem(columnId, item, ref) {
    if (!this.registry[columnId].items[item.id]) {
      return;
    }
    this.registry[columnId].items[item.id].ref = ref;
  }

  registerListView(columnId, listView) {
    this.registry[columnId].listView = listView;
  }

  updateItemWithLayout(columnId, item, previousItem) {
    let ref = this.registry[columnId].items[item.id].ref;
    ref.measure((fx, fy, width, height, px, py) => {
      const layout = { x: px, y: py, width: width, height: height };
      this.registry[columnId].items[item.id].layout = layout;
      if (!this.itemHeight) {
        // TODO: make it just 70 or so
        this.itemHeight = layout.height;
      }
      if (previousItem && previousItem.layout.y > layout.y) {
        this.registry[columnId].items[item.id].visible = false;
      }
    });
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
    for(let item of items) {
      if (visibleItems) {
        item.visible = visibleItems[item.index];
      }
    }
    this.updateLayoutAfterVisibilityChanged(columnId);
  }

  registerColumn(columnId, ref) {
    this.registry[columnId].ref = ref;
  }

  updateColumnWithLayout(columnId) {
    let ref = this.registry[columnId].ref;
    ref.measure((fx, fy, width, height, px, py) => {
      const layout = { x: px, y: py, width: width, height: height };
      this.registry[columnId].layout = layout;
      console.log(['LAYOUT', layout])
    });
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
    this.registry[columnId].items[item.id].hidden = true;
  }

  show(columnId, item) {
    this.registry[columnId].items[item.id].hidden = false;
  }

  move(draggedItem, x, y) {
    const fromColumnId = draggedItem.columnId;
    let columnAtPosition = this.columnAtPosition(x, y);
    if (!columnAtPosition) {
      console.log('NO COLUMN :(')
      return;
    }

    let toColumnId = columnAtPosition.id;
    let itemAtPosition = this.itemAtPosition(toColumnId, x, y);
    if (!itemAtPosition) {
      console.log('NO ITEM! ;(')
      return columnAtPosition;
    }

    let draggedId = draggedItem.id;
    console.log(['DRAG FROM', x, y, draggedItem.columnId, draggedItem.index, draggedItem.id, draggedItem.row.title, draggedItem.layout])
    if (toColumnId != fromColumnId) {
      let fromColumn = this.column(fromColumnId);
      let toColumn = this.column(toColumnId);

      const draggedId = draggedItem.id;
      this.registry[toColumnId].items[draggedId] = draggedItem;
      fromColumn.items = _(fromColumn.items).omit(draggedId);
      this.notify(fromColumnId, 'reload');

      draggedItem = this.registry[toColumnId].items[draggedId];
      draggedItem.visible = true;
      draggedItem.columnId = toColumnId;
      draggedItem.index = -1;
      const items = this.items(toColumnId);
      for (const item of items) {
        item.index += 1;
      }

      const visibleItems = this.visibleItems(toColumnId);
      // TODO: ten ostatni nie zawsze jest wypchniety!
      // jak lista nie wychodzi poza ekran to nie jest!
      //visibleItems[visibleItems.length - 1].visible = false;
      let i = 0;
      while (i < visibleItems.length - 1) {
        visibleItems[i].layout = visibleItems[i + 1].layout;
        i += 1;
      }
    }

    let itemAtPositionId = itemAtPosition.id;
    console.log(['DRAG TO', x, y, itemAtPosition.columnId, itemAtPosition.index, itemAtPosition.id, itemAtPosition.row.title, itemAtPosition.layout])

    if (draggedItem.id == itemAtPosition.id) {
      return columnAtPosition;
    }

    console.log('SWITCHING')
    draggedItem.visible = true;
    let items = this.visibleItems(toColumnId);

    console.log(['BEFORE TO', toColumnId, items.map((item) => [item.index, item.row.title, item.layout])]);

    let draggedItemI = _(items).findIndex((item) => item.id == draggedItem.id);
    let itemAtPositionI = _(items).findIndex((item) => item.id == itemAtPosition.id);
    if (draggedItem.index < itemAtPosition.index) {
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
    console.log(['AFTER FROM', fromColumnId, itemsFrom.map((item) => [item.index, item.row.title, item.layout])]);
    const itemsTo = this.visibleItems(toColumnId)
    console.log(['AFTER TO', toColumnId, itemsTo.map((item) => [item.index, item.row.title, item.layout])]);

    return columnAtPosition;
  }

  switchItems(columnId, firstItem, secondItem) {
    if (!firstItem || !secondItem) {
      return;
    }

    let firstId = firstItem.id;
    let secondId = secondItem.id;
    let firstIndex = firstItem.index;
    let secondIndex = secondItem.index;
    let firstY = firstItem.layout.y;
    let firstRef = firstItem.ref;
    let secondRef = secondItem.ref;

    this.registry[columnId].items[firstId].index = secondIndex;
    this.registry[columnId].items[secondId].index = firstIndex;
    this.registry[columnId].items[secondId].layout.y = firstY;
    this.registry[columnId].items[firstId].layout.y = firstY + secondItem.layout.height;
    this.registry[columnId].items[firstId].ref = secondRef;
    this.registry[columnId].items[secondId].ref = firstRef;
  }

  columns() {
    const columns = _(this.registry).values();
    return _(columns).sortBy('index');
  }

  items(columnId) {
    let items = _(this.registry[columnId].items).values();
    return _(items).sortBy('index');
  }

  visibleItems(columnId) {
    return _(this.items(columnId)).filter((item) => item.visible);
  }

  rows(columnId) {
    return _(this.items(columnId)).map((item) => item.row);
  }

  visibleRows(columnId) {
    return _(this.visibleItems(columnId)).map((item) => item.row);
  }

  columnAtPosition(x, y) {
    let columns = this.columns();

    const threshold = this.itemHeight / 2;

    let column = columns.find((column) => {
      let layout = column.layout;
      return layout && x > layout.x && y > layout.y - threshold && x < layout.x + layout.width && y < layout.y + layout.height + threshold;
    });

    return column;
  }

  scrollingPosition(column, x, y) {
    let layout = column.layout;
    const threshold = this.itemHeight / 2;

    let upperEnd = layout.y;
    let upper = y > upperEnd - threshold && y < upperEnd + threshold;

    let lowerEnd = layout.y + layout.height;
    let lower = y > lowerEnd - threshold && y < lowerEnd + threshold;

    let offset = lower ? 1 : (upper ? -1 : 0);

    return {
      offset: offset,
      scrolling: x > layout.x && x < layout.x + layout.width && (lower || upper)
    };
  }

  itemAtPosition(columnId, x, y) {
    let items = this.visibleItems(columnId);

    let item = items.find((item) => {
      let layout = item.layout;
      return layout && x > layout.x && y > layout.y && x < layout.x + layout.width && y < layout.y + layout.height;
    });
    let firstItem = items[0];
    if (!item && firstItem && firstItem.layout && y <= firstItem.layout.y) {
      item = firstItem;
    }
    let lastItem = items[items.length - 1];
    if (!item && lastItem && lastItem.layout && y >= lastItem.layout.y) {
      item = lastItem;
    }
    return item;
  }

  getLayoutForItem(columnId, item) {
    return this.registry[columnId].items[item.id].layout;
  }
};

export default RowRepository;
