class PositionCalculator {
  TRESHOLD = 35

  columnAtPosition(columns, x, y) {
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

  selectItem(x, y, draggedItem, item) {
    const layout = item.layout();
    const heightDiff = Math.abs(draggedItem.layout().height - layout.height);
    const left = x > layout.x;
    const right = x < layout.x + layout.width;
    let up, down;
    if (heightDiff > layout.height) {
      up = y > layout.y;
      down = y < layout.y + layout.height;
    } else {
      if (y < draggedItem.layout().y) {
        down = y < layout.y + layout.height - heightDiff;
        up = y > layout.y;
      } else {
        down = y < layout.y + layout.height;
        up = y > layout.y + heightDiff;
      }
    }
    return layout && left && right && up && down;
  }

  itemAtPosition(items, columnId, x, y, draggedItem) {
    let item = items.find((item) => this.selectItem(x, y, draggedItem, item));

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

export default PositionCalculator;
