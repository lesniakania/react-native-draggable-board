import _ from 'underscore';
import ColumnItem from './ColumnItem';
import Item from './Item';

class Registry {
  constructor(data) {
    this.map = {};
    if (data) {
      this.updateData(data);
    }
  }

  existingColumnAttributes(columnId) {
    const column = this.column(columnId);
    return column && column.attributes();
  }

  buildColumn(columnIndex, columnData) {
    const columnId = columnData.id;
    const existingAttributes = this.existingColumnAttributes(columnId) || {
      id: columnId,
      index: columnIndex,
      scrollOffset: 0,
      items: {}
    };
    const rows = columnData.rows;
    const itemsMap = this.buildItemsMap(columnId, rows, existingAttributes.items);
    return new ColumnItem(Object.assign(existingAttributes, {
      items: itemsMap,
      data: columnData
    }));
  }

  existingItemAttributes(existingItems, itemId) {
    const item = existingItems[itemId];
    return item && item.attributes();
  }

  buildItemsMap(columnId, rows, existingItems) {
    const items = _.range(rows.length).map((index) => {
      const row = rows[index];
      const id = row.id;
      const existingItemAttributes = this.existingItemAttributes(existingItems, id) || {};
      return new Item(Object.assign(existingItemAttributes, {
        id: id,
        index: index,
        columnId: columnId,
        row: row
      }));
    });

    const itemsMap = {};
    for (const item of items) {
      itemsMap[item.id()] = item;
    }

    return itemsMap;
  }

  updateData(data) {
    const columns = _.range(data.length).map((columnIndex) => {
      const columnData = data[columnIndex];
      return this.buildColumn(columnIndex, columnData);
    });

    for (const column of columns) {
      this.map[column.id()] = column;
    }
  }

  move(fromColumnId, toColumnId, item) {
    const fromColumn = this.column(fromColumnId);
    const toColumn = this.column(toColumnId);

    toColumn.setItem(item);
    fromColumn.removeItem(item);
  }

  columns() {
    const columns = _(this.map).values();
    return _(columns).sortBy((column) => column.index());
  }

  column(columnId) {
    return this.map[columnId];
  }

  items(columnId) {
    const column = this.column(columnId);
    return column && column.items() || [];
  }

  visibleItems(columnId) {
    const column = this.column(columnId);
    return column && column.visibleItems() || [];
  }

  item(columnId, itemId) {
    const column = this.column(columnId);
    return column && column.item(itemId);
  }
};

export default Registry;
